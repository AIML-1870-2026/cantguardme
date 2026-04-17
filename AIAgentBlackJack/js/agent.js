/* ═══════════════════════════════════════════════════════════
   AGENT.JS — LLM agent interface, prompt builder, JSON validation
═══════════════════════════════════════════════════════════ */

BJApp.Agent = {

  VALID_ACTIONS: new Set(['hit', 'stand', 'double', 'split', 'surrender']),

  RISK_DESCRIPTIONS: {
    conservative: 'Prioritize capital preservation. Prefer stand and surrender in marginal spots. Avoid doubling unless the edge is very clear.',
    balanced:     'Follow basic strategy closely. Take positive-EV risks but avoid marginal plays. Use surrender and double when strategically sound.',
    aggressive:   'Maximize expected value aggressively. Double and split whenever EV is positive, even slightly. Rarely surrender.'
  },

  buildSystemPrompt() {
    const risk = BJApp.riskProfile || 'balanced';
    return `You are an expert Blackjack advisor. The rules are: dealer stands on all 17s (S17), 3:2 blackjack payout, late surrender allowed, double down allowed on any first two cards, resplit not allowed.

Risk profile for this session: ${this.RISK_DESCRIPTIONS[risk]}

You MUST respond with ONLY a valid JSON object — no prose before or after. The JSON must exactly match this schema:
{
  "action": "hit" | "stand" | "double" | "split" | "surrender",
  "confidence": 0.0 to 1.0,
  "short_reasoning": "One sentence, max 90 characters, why you recommend this action.",
  "long_reasoning": "2-4 sentences elaborating on the strategy behind this recommendation.",
  "expected_value_estimate": "positive" | "neutral" | "negative"
}

The "action" field MUST be one of the exact strings listed above. Only recommend actions that are in the available_actions list provided.`;
  },

  buildUserMessage(hand, dealerHand, legalActions) {
    const dealerUp = dealerHand.find(c => !c.faceDown);
    const playerStr = hand.cards.map(c => `${c.rank}${c.suit}`).join(', ');
    const total = BJApp.scoreHand(hand.cards);
    const soft = BJApp.isSoftHand(hand.cards);

    return `Your hand: ${playerStr} (total: ${total}, soft: ${soft ? 'yes' : 'no'})
Dealer up card: ${dealerUp.rank}${dealerUp.suit} (value: ${Math.min(dealerUp.value, 10)})
Available actions: ${legalActions.join(', ')}
Bet: $${hand.bet} of $${BJApp.balance + hand.bet} bankroll
What do you recommend?`;
  },

  parseResponse(content) {
    // Strip markdown code blocks if present
    let cleaned = content.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let obj;
    try {
      obj = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON object from text
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        obj = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse JSON from response');
      }
    }

    if (!obj.action || !this.VALID_ACTIONS.has(obj.action.toLowerCase())) {
      throw new Error(`Invalid action: "${obj.action}" — must be one of: ${[...this.VALID_ACTIONS].join(', ')}`);
    }

    obj.action = obj.action.toLowerCase();
    obj.confidence = typeof obj.confidence === 'number'
      ? Math.max(0, Math.min(1, obj.confidence))
      : 0.75;

    return obj;
  },

  getProvider() {
    const p = BJApp.provider || 'openai';
    return { openai: BJApp.OpenAI, anthropic: BJApp.Anthropic, gemini: BJApp.Gemini }[p];
  },

  async recommend(hand, dealerHand, legalActions, handNum) {
    const key = BJApp.getActiveKey();
    if (!key) throw new Error('No API key for selected provider');

    const provider = this.getProvider();
    if (!provider) throw new Error('Unknown provider');

    const systemPrompt = this.buildSystemPrompt();
    const userMessage  = this.buildUserMessage(hand, dealerHand, legalActions);

    const startTime = Date.now();
    let rawResult;
    let retries = 0;

    // Console audit log
    console.group(`▼ Hand #${handNum} · LLM call · ${BJApp.model}`);
    console.log('System prompt:', systemPrompt);
    console.log('User message:', userMessage);

    while (retries < 2) {
      try {
        rawResult = await provider.call(key, BJApp.model, systemPrompt, userMessage);
        break;
      } catch (err) {
        if (retries === 0 && err.message?.includes('JSON')) {
          retries++;
          console.warn('JSON parse failed, retrying with correction...');
          continue;
        }
        console.error('API error:', err.message);
        console.groupEnd();
        throw err;
      }
    }

    const latency = Date.now() - startTime;

    console.log('Raw response:', rawResult.content);
    console.log('Usage:', rawResult.usage);

    let rec;
    try {
      rec = this.parseResponse(rawResult.content);
    } catch (parseErr) {
      console.error('Parse error:', parseErr.message);
      console.groupEnd();
      throw parseErr;
    }

    // Validate legality
    const legal = legalActions.includes(rec.action);
    const stratCode = BJApp.getBasicStrategy(hand.cards, dealerHand.find(c => !c.faceDown));
    const stratAction = BJApp.strategyActionName(stratCode).toLowerCase();
    const agrees = rec.action === stratAction;

    console.log('Parsed action:', rec.action);
    console.log('Legality check:', legal ? '✓' : '✗ ILLEGAL');
    console.log('Basic strategy says:', stratAction, agrees ? '(AGREE)' : '(DISAGREE)');
    console.log('Confidence:', rec.confidence);
    console.log('Latency:', latency + 'ms');
    console.log('Tokens:', (rawResult.usage.prompt_tokens || rawResult.usage.input_tokens || '?'), 'in,', (rawResult.usage.completion_tokens || rawResult.usage.output_tokens || '?'), 'out');
    console.groupEnd();

    if (!legal) {
      console.warn(`Action "${rec.action}" not in legal actions [${legalActions.join(', ')}], falling back to stand`);
      rec.action = legalActions.includes('stand') ? 'stand' : legalActions[0];
      rec.short_reasoning = `(Corrected: original action illegal) ${rec.short_reasoning}`;
    }

    // Estimate token cost
    const inTok  = rawResult.usage.prompt_tokens || rawResult.usage.input_tokens || 200;
    const outTok = rawResult.usage.completion_tokens || rawResult.usage.output_tokens || 60;
    const costs = { openai: [0.000005, 0.000015], anthropic: [0.000003, 0.000015], gemini: [0.00000035, 0.00000105] };
    const [inCost, outCost] = costs[BJApp.provider] || [0.000005, 0.000015];
    BJApp.stats.tokenCost += inTok * inCost + outTok * outCost;

    rec.latency = latency;
    return rec;
  },

  async refreshModels() {
    const key = BJApp.getActiveKey();
    if (!key) { BJApp.showToast('No key for selected provider', 'warn'); return; }

    const provider = this.getProvider();
    if (!provider) return;

    BJApp.showToast('Fetching models…', 'info');
    try {
      const models = await provider.fetchModels(key);
      const sel = document.getElementById('model-select');
      if (!sel) return;
      const current = sel.value;
      sel.innerHTML = models.map(m => `<option value="${m}"${m === current ? ' selected' : ''}>${m}</option>`).join('');
      BJApp.model = sel.value;
      BJApp.showToast(`${models.length} models loaded`, 'success');
    } catch (err) {
      BJApp.showToast(`Model fetch failed: ${err.message}`, 'error');
    }
  }
};
