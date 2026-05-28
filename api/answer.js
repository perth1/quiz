const { state, QUESTIONS, calcScore, advanceIfNeeded, revealResult } = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    advanceIfNeeded();

    let data;
    try { data = JSON.parse(body); } catch { return res.status(400).json({ error: 'invalid' }); }

    const { pid, idx } = data;
    const player = state.players[pid];
    if (!player) return res.status(400).json({ error: 'ไม่พบผู้เล่น' });
    if (state.phase !== 'question') return res.status(400).json({ error: 'ยังไม่ถึงเวลาตอบ' });
    if (player.answeredQ === state.currentQ) return res.status(400).json({ error: 'ตอบแล้ว' });

    player.answeredQ = state.currentQ;
    player.lastSeen = Date.now();

    const elapsed = (Date.now() - state.questionStartedAt) / 1000;
    const correct = QUESTIONS[state.currentQ].ans === Number(idx);
    let pts = 0;

    if (correct) {
      pts = calcScore(elapsed);
      player.score += pts;
    }

    state.answers[pid] = { idx, elapsed, correct };

    // early advance if everyone answered
    const activePlayers = Object.keys(state.players).filter(p => (state.players[p].lastSeen || 0) > Date.now() - 10000);
    const allAnswered = activePlayers.every(p => state.answers[p]);
    if (allAnswered && activePlayers.length > 0) {
      setTimeout(revealResult, 600);
    }

    res.json({ correct, pts, score: player.score });
  });
};
