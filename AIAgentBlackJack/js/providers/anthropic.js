/* ═══════════════════════════════════════════════════════════
   PROVIDERS/ANTHROPIC.JS — Anthropic API integration
═══════════════════════════════════════════════════════════ */

BJApp.Anthropic = {

  MODELS: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-7'],
  ENDPOINT: 'https://api.anthropic.com/v1/messages',

  async fetchModels(key) {
    return this.MODELS;
  },

  async call(key, model, systemPrompt, userMessage) {
    const body = {
      model,
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.3
    };

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 30000);

    const res = await fetch(this.ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });

    clearTimeout(tid);

    if (res.status === 401) throw new Error('Invalid Anthropic API key');
    if (res.status === 429) throw new Error('Anthropic rate limit exceeded');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data.content?.[0]?.text;
    if (!content) throw new Error('Empty response from Anthropic');

    return {
      content,
      usage: data.usage || {},
      model: data.model || model
    };
  }
};
