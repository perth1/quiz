const { state, QUESTIONS, TIME_PER_Q, advanceIfNeeded, pruneStale } = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const { pid, name } = req.query;

  // auto-advance phases based on timer
  advanceIfNeeded();
  pruneStale();

  // register / heartbeat player
  if (pid && name && state.phase === 'lobby') {
    if (!state.players[pid]) {
      state.players[pid] = { name: decodeURIComponent(name), score: 0, answeredQ: -1, lastSeen: Date.now() };
    }
  }
  if (pid && state.players[pid]) {
    state.players[pid].lastSeen = Date.now();
  }

  const playerCount = Object.keys(state.players).length;
  const q = state.currentQ >= 0 ? QUESTIONS[state.currentQ] : null;

  // time remaining for current question
  let timeLeft = null;
  if (state.phase === 'question' && state.questionStartedAt) {
    timeLeft = Math.max(0, TIME_PER_Q - (Date.now() - state.questionStartedAt) / 1000);
  }

  const myPlayer = pid ? state.players[pid] : null;
  const myAnsweredThisQ = myPlayer ? myPlayer.answeredQ === state.currentQ : false;

  const payload = {
    phase: state.phase,
    playerCount,
    currentQ: state.currentQ,
    total: QUESTIONS.length,
    timeLeft,
    myScore: myPlayer?.score ?? 0,
    myAnswered: myAnsweredThisQ,
  };

  if (state.phase === 'question' && q) {
    payload.question = q.q;
    payload.opts = q.opts;
  }

  if (state.phase === 'result' && q) {
    payload.correctIdx = q.ans;
    payload.correctText = q.opts[q.ans];
    payload.leaderboard = state.leaderboard;
    payload.isLast = state.currentQ + 1 >= QUESTIONS.length;
    payload.nextIn = state.nextPhaseAt ? Math.max(0, Math.round((state.nextPhaseAt - Date.now()) / 1000)) : 0;
  }

  if (state.phase === 'ended') {
    payload.leaderboard = state.leaderboard;
  }

  // countdown phase
  if (state.phase === 'countdown') {
    payload.countdownLeft = state.nextPhaseAt ? Math.max(0, Math.round((state.nextPhaseAt - Date.now()) / 1000)) : 0;
  }

  res.json(payload);
};
