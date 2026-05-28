// Shared in-memory state (persists within the same serverless instance)
// Vercel warm instances share this via module cache

const QUESTIONS = [
  { q: "Bitcoin ถูกสร้างขึ้นในปีใด?", opts: ["2005","2008","2009","2011"], ans: 2 },
  { q: "ใครคือผู้สร้าง Bitcoin?", opts: ["Vitalik Buterin","Satoshi Nakamoto","Charlie Lee","Elon Musk"], ans: 1 },
  { q: "Blockchain คืออะไร?", opts: ["ฐานข้อมูลกลางที่ควบคุมโดยธนาคาร","สกุลเงินดิจิทัล","บัญชีแยกประเภทแบบกระจายศูนย์","โปรแกรมขุด crypto"], ans: 2 },
  { q: "Bitcoin มีจำนวนสูงสุดกี่เหรียญ?", opts: ["10 ล้าน","21 ล้าน","100 ล้าน","ไม่จำกัด"], ans: 1 },
  { q: "Ethereum ใช้ภาษาโปรแกรมใดเขียน Smart Contract?", opts: ["Python","JavaScript","Solidity","Rust"], ans: 2 },
  { q: "NFT ย่อมาจากอะไร?", opts: ["New Financial Token","Non-Fungible Token","Network File Transfer","Next Finance Tech"], ans: 1 },
  { q: "การ 'ขุด' (Mining) Crypto คืออะไร?", opts: ["การซื้อ crypto ในราคาต่ำ","การขาย crypto เพื่อทำกำไร","การใช้คอมพิวเตอร์ยืนยันธุรกรรมบน blockchain","การแลกเปลี่ยน crypto เป็นเงินสด"], ans: 2 },
  { q: "DeFi ย่อมาจากอะไร?", opts: ["Digital Finance","Decentralized Finance","Deferred Finance","Digital Federal Infrastructure"], ans: 1 },
  { q: "Altcoin คืออะไร?", opts: ["Bitcoin ที่ถูกดัดแปลง","เหรียญ crypto ทุกชนิดที่ไม่ใช่ Bitcoin","เหรียญที่ออกโดยธนาคารกลาง","สกุลเงินดิจิทัลที่รัฐบาลสร้าง"], ans: 1 },
  { q: "Stablecoin ต่างจาก crypto ทั่วไปอย่างไร?", opts: ["ราคาผันผวนสูงกว่า","ผูกมูลค่ากับสินทรัพย์อ้างอิง เช่น USD","ขุดได้เร็วกว่า","ใช้พลังงานน้อยกว่า"], ans: 1 },
  { q: "Private Key ใน Crypto Wallet คืออะไร?", opts: ["รหัสผ่านที่แชร์กับ exchange","รหัสลับที่ใช้เข้าถึงและโอน crypto ของตัวเอง","เลขบัญชีธนาคาร","QR Code สำหรับรับเงิน"], ans: 1 },
  { q: "Ethereum 2.0 เปลี่ยนจาก Proof of Work เป็นอะไร?", opts: ["Proof of Authority","Proof of History","Proof of Stake","Proof of Space"], ans: 2 }
];

const TIME_PER_Q = 15; // seconds

// Game state singleton
const state = {
  phase: 'lobby',      // lobby | countdown | question | result | ended
  currentQ: -1,
  questionStartedAt: null,
  players: {},         // { [pid]: { name, score, answeredQ } }
  answers: {},         // { [pid]: { idx, time } }  for current question
  leaderboard: [],
  lastActivity: Date.now(),
  nextPhaseAt: null,   // epoch ms when auto-advance happens
};

function getLeaderboard() {
  return Object.values(state.players)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
    .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score }));
}

function calcScore(elapsedSec) {
  const pct = Math.max(0, 1 - elapsedSec / TIME_PER_Q);
  return Math.round(100 + 900 * pct);
}

function advanceIfNeeded() {
  if (!state.nextPhaseAt) return;
  if (Date.now() < state.nextPhaseAt) return;
  state.nextPhaseAt = null;

  if (state.phase === 'countdown') {
    startQuestion();
  } else if (state.phase === 'question') {
    revealResult();
  } else if (state.phase === 'result') {
    if (state.currentQ + 1 >= QUESTIONS.length) {
      endGame();
    } else {
      startQuestion();
    }
  }
}

function startQuestion() {
  state.currentQ++;
  if (state.currentQ >= QUESTIONS.length) return endGame();
  state.answers = {};
  state.phase = 'question';
  state.questionStartedAt = Date.now();
  state.nextPhaseAt = Date.now() + TIME_PER_Q * 1000;
}

function revealResult() {
  state.leaderboard = getLeaderboard();
  state.phase = 'result';
  const isLast = state.currentQ + 1 >= QUESTIONS.length;
  state.nextPhaseAt = isLast ? null : Date.now() + 6000;
  if (isLast) {
    setTimeout(endGame, 6000);
  }
}

function endGame() {
  state.leaderboard = getLeaderboard();
  state.phase = 'ended';
  state.nextPhaseAt = null;
}

function resetGame() {
  state.phase = 'lobby';
  state.currentQ = -1;
  state.questionStartedAt = null;
  state.answers = {};
  state.leaderboard = [];
  state.nextPhaseAt = null;
  Object.values(state.players).forEach(p => { p.score = 0; p.answeredQ = -1; });
}

function pruneStale() {
  const cutoff = Date.now() - 30000; // 30s no-poll = gone
  for (const pid of Object.keys(state.players)) {
    if ((state.players[pid].lastSeen || 0) < cutoff) {
      delete state.players[pid];
    }
  }
}

module.exports = { state, QUESTIONS, TIME_PER_Q, getLeaderboard, calcScore, advanceIfNeeded, startQuestion, revealResult, endGame, resetGame, pruneStale };
