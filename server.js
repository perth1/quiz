const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

// ─── Questions ───────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    q: "Bitcoin ถูกสร้างขึ้นในปีใด?",
    opts: ["2005","2008","2009","2011"],
    ans: 2
  },
  {
    q: "ใครคือผู้สร้าง Bitcoin?",
    opts: ["Vitalik Buterin","Satoshi Nakamoto","Charlie Lee","Elon Musk"],
    ans: 1
  },
  {
    q: "Blockchain คืออะไร?",
    opts: ["ฐานข้อมูลกลางที่ควบคุมโดยธนาคาร","สกุลเงินดิจิทัล","บัญชีแยกประเภทแบบกระจายศูนย์","โปรแกรมขุด crypto"],
    ans: 2
  },
  {
    q: "Bitcoin มีจำนวนสูงสุดกี่เหรียญ?",
    opts: ["10 ล้าน","21 ล้าน","100 ล้าน","ไม่จำกัด"],
    ans: 1
  },
  {
    q: "Ethereum ใช้ภาษาโปรแกรมใดเขียน Smart Contract?",
    opts: ["Python","JavaScript","Solidity","Rust"],
    ans: 2
  },
  {
    q: "NFT ย่อมาจากอะไร?",
    opts: ["New Financial Token","Non-Fungible Token","Network File Transfer","Next Finance Tech"],
    ans: 1
  },
  {
    q: "การ 'ขุด' (Mining) Crypto คืออะไร?",
    opts: ["การซื้อ crypto ในราคาต่ำ","การขาย crypto เพื่อทำกำไร","การใช้คอมพิวเตอร์ยืนยันธุรกรรมบน blockchain","การแลกเปลี่ยน crypto เป็นเงินสด"],
    ans: 2
  },
  {
    q: "DeFi ย่อมาจากอะไร?",
    opts: ["Digital Finance","Decentralized Finance","Deferred Finance","Digital Federal Infrastructure"],
    ans: 1
  },
  {
    q: "Altcoin คืออะไร?",
    opts: ["Bitcoin ที่ถูกดัดแปลง","เหรียญ crypto ทุกชนิดที่ไม่ใช่ Bitcoin","เหรียญที่ออกโดยธนาคารกลาง","สกุลเงินดิจิทัลที่รัฐบาลสร้าง"],
    ans: 1
  },
  {
    q: "Stablecoin ต่างจาก crypto ทั่วไปอย่างไร?",
    opts: ["ราคาผันผวนสูงกว่า","ผูกมูลค่ากับสินทรัพย์อ้างอิง เช่น USD","ขุดได้เร็วกว่า","ใช้พลังงานน้อยกว่า"],
    ans: 1
  },
  {
    q: "Private Key ใน Crypto Wallet คืออะไร?",
    opts: ["รหัสผ่านที่แชร์กับ exchange","รหัสลับที่ใช้เข้าถึงและโอน crypto ของตัวเอง","เลขบัญชีธนาคาร","QR Code สำหรับรับเงิน"],
    ans: 1
  },
  {
    q: "Ethereum 2.0 เปลี่ยนจาก Proof of Work เป็นอะไร?",
    opts: ["Proof of Authority","Proof of History","Proof of Stake","Proof of Space"],
    ans: 2
  }
];

const TIME_PER_Q = 15000; // ms
const SHOW_LEADERBOARD_MS = 6000;
const LOBBY_COUNTDOWN = 5000;

// ─── Game State ───────────────────────────────────────────────────────────────
let gameState = 'lobby'; // lobby | countdown | question | leaderboard | ended
let currentQ = -1;
let questionStartTime = 0;
let players = new Map(); // ws -> { name, score, answered }
let answers = new Map(); // ws -> { idx, time }
let questionTimer = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

function getLeaderboard() {
  return [...players.entries()]
    .map(([, p]) => ({ name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

function calcScore(timeMs) {
  const elapsed = Math.min(timeMs, TIME_PER_Q);
  return Math.max(100, Math.round(1000 - (elapsed / TIME_PER_Q) * 900));
}

// ─── Game Flow ────────────────────────────────────────────────────────────────
function startGame() {
  if (players.size === 0) return;
  gameState = 'countdown';
  broadcast({ type: 'countdown', sec: LOBBY_COUNTDOWN / 1000 });
  setTimeout(() => nextQuestion(), LOBBY_COUNTDOWN);
}

function nextQuestion() {
  currentQ++;
  if (currentQ >= QUESTIONS.length) return endGame();

  answers.clear();
  players.forEach(p => p.answered = false);

  gameState = 'question';
  questionStartTime = Date.now();

  const q = QUESTIONS[currentQ];
  broadcast({
    type: 'question',
    index: currentQ,
    total: QUESTIONS.length,
    question: q.q,
    opts: q.opts,
    timeMs: TIME_PER_Q
  });

  clearTimeout(questionTimer);
  questionTimer = setTimeout(() => showLeaderboard(), TIME_PER_Q);
}

function showLeaderboard() {
  clearTimeout(questionTimer);
  gameState = 'leaderboard';

  // reveal correct answer + leaderboard
  const q = QUESTIONS[currentQ];
  broadcast({
    type: 'leaderboard',
    correctIdx: q.ans,
    correctText: q.opts[q.ans],
    board: getLeaderboard(),
    isLast: currentQ === QUESTIONS.length - 1
  });

  setTimeout(() => nextQuestion(), SHOW_LEADERBOARD_MS);
}

function endGame() {
  gameState = 'ended';
  broadcast({ type: 'ended', board: getLeaderboard() });
}

function resetGame() {
  clearTimeout(questionTimer);
  gameState = 'lobby';
  currentQ = -1;
  questionStartTime = 0;
  answers.clear();
  players.forEach(p => { p.score = 0; p.answered = false; });
  broadcast({ type: 'reset', players: players.size });
}

// ─── WebSocket ────────────────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  send(ws, {
    type: 'welcome',
    state: gameState,
    players: players.size,
    currentQ,
    total: QUESTIONS.length
  });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'join': {
        const name = String(msg.name || '').trim().slice(0, 20);
        if (!name) return send(ws, { type: 'error', text: 'ต้องใส่ชื่อก่อน' });
        if (gameState !== 'lobby') return send(ws, { type: 'error', text: 'เกมเริ่มแล้ว รอรอบหน้า' });

        players.set(ws, { name, score: 0, answered: false });
        broadcast({ type: 'playerJoined', name, players: players.size });
        send(ws, { type: 'joined', name });
        break;
      }
      case 'start': {
        if (gameState !== 'lobby') return;
        if (players.size < 1) return send(ws, { type: 'error', text: 'ต้องมีผู้เล่นก่อน' });
        startGame();
        break;
      }
      case 'answer': {
        const player = players.get(ws);
        if (!player || player.answered) return;
        if (gameState !== 'question') return;

        const idx = Number(msg.idx);
        if (idx < 0 || idx > 3) return;

        player.answered = true;
        const elapsed = Date.now() - questionStartTime;
        answers.set(ws, { idx, time: elapsed });

        const correct = QUESTIONS[currentQ].ans === idx;
        if (correct) {
          const pts = calcScore(elapsed);
          player.score += pts;
          send(ws, { type: 'answerResult', correct: true, pts, score: player.score });
        } else {
          send(ws, { type: 'answerResult', correct: false, pts: 0, score: player.score });
        }

        // if everyone answered → go early
        const allAnswered = [...players.values()].every(p => p.answered);
        if (allAnswered) {
          clearTimeout(questionTimer);
          setTimeout(() => showLeaderboard(), 800);
        }
        break;
      }
      case 'reset': {
        resetGame();
        break;
      }
    }
  });

  ws.on('close', () => {
    players.delete(ws);
    answers.delete(ws);
    broadcast({ type: 'playerLeft', players: players.size });
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Crypto Quiz running on port ${PORT}`));
