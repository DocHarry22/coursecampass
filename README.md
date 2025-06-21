"# coursecampass" 
# 📚 CourseCompass

**CourseCompass** is a modular web application designed to assist South African high school learners with academic planning, university eligibility analysis, and APS (Admission Point Score) calculations based on multiple universities' criteria.

This is a full-stack application built using React (frontend) and Node.js + Express (backend), with extensibility in mind for features like course recommendations, scheduling, and social learning communities.

---

## 🔍 Features Implemented So Far

### 🎯 APS Calculator
- Input multiple subjects and their scores (%)
- Choose from supported South African universities:
  - WITS
  - UP
  - UJ
  - UCT
  - SUN
  - Or calculate all simultaneously
- Responsive UI with dynamic form
- Custom subject input + request dialogue
- Integrated backend route for calculating APS per university scale

---

## 🧱 Project Structure

```bash
coursecompass/
├── backend/                # Node.js API server
│   ├── routes/
│   │   └── apcalculator.js
│   └── index.js
├── react-admin/           # React frontend admin UI
│   ├── src/
│   │   ├── scenes/apcalculator/APCalculator.jsx
│   │   ├── scenes/global/Sidebar.jsx
│   │   └── App.js
│   └── public/, package.json, etc.
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (optional for later modules)

### Install Frontend
```bash
cd react-admin
npm install
npm start
```

### Install Backend
```bash
cd backend
npm install
node index.js  # or npx nodemon index.js
```

Backend listens on `http://localhost:5000/api`.

---

## 📐 APS Calculation Logic
APS scores are calculated per university’s published policies. Example:
- **WITS**: 90% = 8, 80% = 7, ..., <30% = 0
- **UP**: Slightly different scale
- Returns total APS for each institution

Supports both **single university** mode and **'all' mode** comparison.

---

## 📌 To Do (Next Modules)
- [ ] Store APS history by user (backend + MongoDB)
- [ ] Course database & search
- [ ] Academic planner with calendar sync
- [ ] User auth (JWT or Firebase)
- [ ] File upload/download for past papers
- [ ] Social learning features (forums, messaging)

---

## 💼 License
MIT License — free to use, modify, and expand for educational/non-commercial purposes.

---

## 🧠 Vision
CourseCompass is designed to scale beyond South Africa, integrating multi-national APS/UCAS systems and growing into a smart academic advisor powered by local data, feedback, and peer networks.

---

> Built with love and logic by **DocHarry – Director of DoCHEng** 🧪
