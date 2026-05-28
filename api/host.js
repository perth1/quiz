const { state, startQuestion, resetGame } = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    let data;
    try { data = JSON.parse(body); } catch { return res.status(400).json({ error: 'invalid' }); }

    if (data.action === 'start') {
      if (state.phase !== 'lobby') return res.status(400).json({ error: 'เกมกำลังดำเนินอยู่' });
      if (Object.keys(state.players).length < 1) return res.status(400).json({ error: 'ต้องมีผู้เล่นก่อน' });

      state.phase = 'countdown';
      state.nextPhaseAt = Date.now() + 5000;
      return res.json({ ok: true, phase: 'countdown' });
    }

    if (data.action === 'reset') {
      resetGame();
      return res.json({ ok: true, phase: 'lobby' });
    }

    res.status(400).json({ error: 'unknown action' });
  });
};
