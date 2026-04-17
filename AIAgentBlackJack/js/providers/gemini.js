/* ═══════════════════════════════════════════════════════════
   PROVIDERS/GEMINI.JS — Google Gemini API integration
═══════════════════════════════════════════════════════════ */

BJApp.Gemini = {

  MODELS: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  BASE: 'https://generativelanguage.googleapis.com/v1beta/models',

  getEndpoint(model) {
    return `${this.BASE}/${model}:generateContent`;
  },

  async fetchModels(key) {
    try {
      const res = await fetch(`${this.BASE}?key=${key}`);
      if (!res.ok) return this.MODELS;
      const data = await res.json();
      return (data.models || [])
        .map(m => m.name.replace('models/', ''))
        .filter(n => n.startsWith('gemini'))
        .slice(0, 10);
    } catch {
      return this.MODELS;
    }
  },

  async call(key, model, systemPrompt, userMessage) {
    const url = `${this.getEndpoint(model)}?key=${key}`;

    const body = {
      contents: [{
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 512
      }
    };

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 30000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });

    clearTimeout(tid);

    if (res.status === 400) throw new Error('Gemini: bad request — check model name');
    if (res.status === 401 || res.status === 403) throw new Error('Invalid Gemini API key');
    if (res.status === 429) throw new Error('Gemini rate limit exceeded');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('Empty response from Gemini');

    return {
      content,
      usage: { input_tokens: data.usageMetadata?.promptTokenCount, output_tokens: data.usageMetadata?.candidatesTokenCount },
      model
    };
  }
};
