/* ═══════════════════════════════════════════════════════════
   HISTORY.JS — Hand history log, rendering, export
═══════════════════════════════════════════════════════════ */

BJApp.handHistory = [];
BJApp.handNumber = 0;

BJApp.recordHand = function(record) {
  BJApp.handHistory.unshift(record); // newest first
  BJApp.renderHistory();
};

BJApp.renderHistory = function() {
  const list = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  if (!list) return;

  if (BJApp.handHistory.length === 0) {
    empty && (empty.style.display = 'block');
    list.innerHTML = '';
    return;
  }

  empty && (empty.style.display = 'none');

  list.innerHTML = BJApp.handHistory.slice(0, 50).map(h => {
    const playerStr = h.playerHands.map(ph =>
      ph.cards.map(c => `${c.rank}${c.suit}`).join(' ') + ` (${BJApp.scoreHand(ph.cards)})`
    ).join(' | ');

    const dealerStr = h.dealerCards.map(c => `${c.rank}${c.suit}`).join(' ') + ` (${BJApp.scoreHand(h.dealerCards)})`;

    const stratMatch = h.strategyAction ? (
      h.strategyAction.toLowerCase() === h.aiAction.toLowerCase()
        ? '<span style="color:#3ec87a">✓ Strategy match</span>'
        : `<span style="color:#e09030">⚠ Strategy: ${BJApp.strategyActionName(h.strategyAction)}</span>`
    ) : '';

    const delta = h.balanceDelta >= 0
      ? `<span style="color:#3ec87a">+$${h.balanceDelta.toFixed(0)}</span>`
      : `<span style="color:#e05555">-$${Math.abs(h.balanceDelta).toFixed(0)}</span>`;

    return `
      <div class="history-item">
        <div class="history-item-header">
          <span class="history-hand-num">Hand #${h.handNumber}</span>
          <span class="history-outcome ${h.outcome.toLowerCase().replace(' ','-')}">${h.outcome}</span>
        </div>
        <div class="history-detail">
          <strong>You:</strong> ${playerStr}<br>
          <strong>Dealer:</strong> ${dealerStr}<br>
          <strong>Bet:</strong> $${h.bet} &nbsp; <strong>Result:</strong> ${delta}<br>
          <strong>AI:</strong> ${h.aiAction || '—'} &nbsp; ${stratMatch}<br>
          <span style="opacity:0.6">${h.model || ''} · ${h.latency ? h.latency + 'ms' : ''} · conf: ${h.confidence ? (h.confidence * 100).toFixed(0) + '%' : '—'}</span>
        </div>
      </div>`;
  }).join('');
};

BJApp.exportHistory = function() {
  const data = JSON.stringify({
    session: new Date().toISOString(),
    stats: BJApp.stats,
    hands: BJApp.handHistory
  }, null, 2);

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blackjack-session-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  BJApp.showToast('Session exported', 'success');
};
