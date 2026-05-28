const { state } = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    let data;
    try { data = JSON.parse(body); } catch { return res.status(400).json({ error: 'invalid json' }); }

    const name = String(data.name || '').trim().slice(0, 20);
    if (!name) return res.status(400).json({ error: 'ต้องใส่ชื่อก่อน' });
    if (state.phase !== 'lobby') return res.status(400).json({ error: 'เกมเริ่มแล้ว รอรอบหน้า' });

    const pid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    state.players[pid] = { name, score: 0, answeredQ: -1, lastSeen: Date.now() };

    res.json({ pid, name, playerCount: Object.keys(state.players).length });
  });
};
