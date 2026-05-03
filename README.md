---
title: Velora API
emoji: 🏎️
colorFrom: blue
colorTo: red
sdk: docker
app_port: 7860
---

# 🏎️ Velora: Premium AI-Powered Car Marketplace

![Velora Banner](https://img.shields.io/badge/Velora-Premium_Marketplace-FF4B2B?style=for-the-badge&logo=fastapi&logoColor=white)
![Build Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-FastAPI_%7C_React_%7C_ML-blue?style=for-the-badge)

Velora is a state-of-the-art car marketplace that leverages Artificial Intelligence to provide accurate price predictions, advanced search capabilities, and a seamless buying/selling experience. Designed with a premium dark-themed aesthetic and high-performance architecture.

---

## ✨ Key Features

- **🤖 AI Price Prediction**: Get real-time, data-driven price estimates for your vehicle using our advanced XGBoost machine learning model.
- **💬 AI Assistant (VeloraBot)**: An intelligent chatbot to help users with car valuation, market trends, and platform navigation.
- **🔍 Smart Search**: Natural language filtering and advanced parameters to find your perfect car.
- **💬 Real-time Chat**: Connect buyers and sellers instantly with built-in messaging.
- **📊 Admin Dashboard**: Comprehensive analytics and listing management for platform administrators.
- **🛡️ Trust & Safety**: Integrated seller verification and trust scores.
- **📱 Responsive Design**: Fully optimized for mobile, tablet, and desktop experiences.

---

## 🛠️ Technology Stack

### Backend (API)
- **FastAPI**: High-performance Python framework.
- **SQLAlchemy**: Powerful ORM for database management.
- **XGBoost**: Machine learning for price prediction.
- **JWT**: Secure authentication and authorization.

### Frontend (UI)
- **React + Vite**: Fast and modern frontend development.
- **TypeScript**: Type-safe code for reliability.
- **Vanilla CSS**: Premium, custom-crafted styling for a unique brand identity.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL

### Backend Setup
1. `pip install -r requirements.txt`
2. Configure `.env` with your `DATABASE_URL`.
3. `uvicorn app.main:app --reload`

### Frontend Setup
1. `cd velora-frontend`
2. `npm install`
3. `npm run dev`

---

## 📸 Screenshots

<p align="center">
  <img src="docs/screenshots/hero_screenshot.png" alt="Velora Home Page" width="800">
  <br>
  <i>Premium Dark-Themed Marketplace Interface</i>
</p>

---

## 🌐 Deployment

This project is optimized for deployment on:
- **Backend**: Render / Railway
- **Frontend**: Vercel / Netlify
- **Database**: Supabase / Render PostgreSQL

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Developed with ❤️ by [Syeda Muskan](https://github.com/SyedaaMuskan)
