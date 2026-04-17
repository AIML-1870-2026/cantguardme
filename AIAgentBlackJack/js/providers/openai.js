/* ═══════════════════════════════════════════════════════════
   PROVIDERS/OPENAI.JS — OpenAI API integration
═══════════════════════════════════════════════════════════ */

BJApp.OpenAI = {

  MODELS: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-mini', 'o1'],
  ENDPOINT: 'https://api.openai.com/v1/chat/completions',
  MODELS_ENDPOINT: 'https://api.openai.com/v1/models',

  async fetchModels(key) {
    try {
      const res = await fetch(this.MODELS_ENDPOINT, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (!res.ok) return this.MODELS;
      const data = await res.json();
      return data.data
        .map(m => m.id)
        .filter(id => id.startsWith('gpt') || id.startsWith('o1') || id.startsWith('o3'))
        .sort()
        .slice(0, 20);
    } catch {
      return this.MODELS;
    }
  },

  async call(key, model, systemPrompt, userMessage) {
    const isO1 = model.startsWith('o1') || model.startsWith('o3');

    const body = {
      model,
      messages: [
        ...(isO1 ? [] : [{ role: 'system', content: systemPrompt }]),
        { role: 'user', content: isO1 ? `${systemPrompt}\n\n${userMessage}` : userMessage }
      ],
      ...(isO1 ? {} : {
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 400
      })
    };

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 30000);

    const res = await fetch(this.ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });

    clearTimeout(tid);

    if (res.status === 401) throw new Error('Invalid OpenAI API key');
    if (res.status === 429) throw new Error('OpenAI rate limit exceeded');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenAI');

    return {
      content,
      usage: data.usage || {},
      model: data.model || model
    };
  }
};
