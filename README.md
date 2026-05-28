# 🪙 CryptoQuiz — Kahoot-style Real-time Quiz

แอปถาม-ตอบ Crypto แบบ Real-time รองรับผู้เล่น 60+ คนพร้อมกัน

## Features
- ✅ 12 คำถาม Crypto พร้อมตัวเลือก 4 ข้อ
- ✅ นับเวลาถอยหลัง 15 วิ/ข้อ
- ✅ คะแนนไล่ตามความเร็ว (ตอบเร็ว = ได้มากกว่า)
- ✅ Leaderboard real-time หลังทุกข้อ
- ✅ Host panel แยกต่างหาก
- ✅ รองรับผู้เล่น 60+ คนพร้อมกัน (WebSocket)

---

## 🚀 Deploy บน Railway (แนะนำ)

### 1. สร้าง GitHub repo
```bash
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/YOUR_USERNAME/crypto-quiz.git
git push -u origin main
```

### 2. Deploy บน Railway
1. ไปที่ [railway.app](https://railway.app) → Login ด้วย GitHub
2. กด **New Project** → **Deploy from GitHub repo**
3. เลือก repo `crypto-quiz`
4. Railway จะ deploy อัตโนมัติ ✅
5. ไปที่ **Settings → Networking → Generate Domain** เพื่อได้ URL

### 3. แชร์ URL ให้ผู้เล่น
เช่น `https://crypto-quiz-production.up.railway.app`

---

## 🚀 Deploy บน Render

1. ไปที่ [render.com](https://render.com) → New → **Web Service**
2. Connect GitHub repo
3. ตั้งค่า:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. กด **Create Web Service** ✅

---

## 🎮 วิธีเล่น

### Host (ผู้ดำเนินเกม)
1. เปิด URL บนหน้าจอ projector
2. กด **"เข้าสู่ระบบ Host"**
3. รอผู้เล่นเข้าร่วมครบ
4. กด **"▶ เริ่มเกม"**

### ผู้เล่น
1. เปิด URL บนมือถือ/คอมพิวเตอร์
2. ใส่ชื่อ → กด **"เข้าร่วม"**
3. รอ host เริ่ม แล้วตอบคำถาม!

---

## 🛠 Run ในเครื่อง

```bash
npm install
npm start
# เปิด http://localhost:3000
```

---

## 📊 ระบบคะแนน

| เวลาที่ตอบ | คะแนนที่ได้ |
|------------|------------|
| 0-1 วิ     | ~1,000 pts |
| 7-8 วิ     | ~550 pts   |
| 15 วิ (สุดท้าย) | 100 pts |
| ผิด / หมดเวลา | 0 pts |

---

## Project Structure

```
crypto-quiz/
├── server.js          # Node.js + WebSocket server + game logic
├── public/
│   └── index.html     # Frontend (join, host, question, leaderboard)
├── package.json
└── README.md
```
