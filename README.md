# 🪙 CryptoQuiz — Vercel Edition

Kahoot-style Crypto Quiz รองรับผู้เล่น 60+ คน  
Deploy บน **Vercel** อย่างเดียว ไม่ต้องใช้ server แยก

## 🚀 Deploy บน Vercel (3 ขั้นตอน)

### วิธีที่ 1 — ผ่าน GitHub (แนะนำ)

```bash
# 1. สร้าง GitHub repo แล้ว push
git init
git add .
git commit -m "init crypto quiz"
git remote add origin https://github.com/YOUR_USERNAME/crypto-quiz.git
git push -u origin main

# 2. ไปที่ vercel.com → Add New Project → Import Git Repository
# 3. เลือก repo → Deploy ✅ (ไม่ต้องตั้งค่าอะไรเพิ่ม)
```

### วิธีที่ 2 — Vercel CLI

```bash
npm i -g vercel
vercel
# ตอบ Y ทุกข้อ → ได้ URL ทันที ✅
```

---

## 📁 โครงสร้างไฟล์

```
crypto-quiz-vercel/
├── api/
│   ├── _store.js     # Shared game state + logic
│   ├── poll.js       # GET /api/poll  — ดึง game state (เรียกทุก 1.2 วิ)
│   ├── join.js       # POST /api/join — ลงทะเบียนผู้เล่น
│   ├── answer.js     # POST /api/answer — ส่งคำตอบ
│   └── host.js       # POST /api/host — start / reset game
├── public/
│   └── index.html    # UI ทั้งหมด
├── package.json
└── vercel.json
```

---

## 🎮 วิธีใช้งาน

### Host
1. เปิด URL บนหน้าจอ projector/จอใหญ่
2. กด **"เข้าสู่หน้า Host"**
3. รอผู้เล่นเข้าครบ → กด **"▶ เริ่มเกม"**

### ผู้เล่น
1. เปิด URL บนมือถือ
2. ใส่ชื่อ → กด **"เข้าร่วม"**
3. รอ host เริ่ม แล้วตอบคำถาม!

---

## 📊 ระบบคะแนน

| ตอบเร็วแค่ไหน | ได้คะแนน |
|--------------|---------|
| 0–1 วิ | ~1,000 pts |
| ~7 วิ  | ~550 pts  |
| 15 วิ  | 100 pts   |
| ผิด / หมดเวลา | 0 pts |

---

## ⚠️ ข้อจำกัด Vercel (Polling vs WebSocket)

- Delay ~1–2 วิ (polling ทุก 1.2 วิ) แทน real-time WebSocket
- State ใช้ in-memory → ถ้า Vercel spin ขึ้น instance ใหม่ จะ reset
- เหมาะสำหรับ session สั้น (1 เกม ต่อครั้ง)
- ถ้าต้องการ persistent state 100% → ใช้ Railway/Render แทน
