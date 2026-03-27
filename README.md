# 🍨 Friends Gola POS - Full-Stack Point of Sale System

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-brightgreen)](https://vitejs.dev/) [![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-blue)](https://expressjs.com/) [![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-brightblue)](https://mongodb.com/atlas) [![Deploy](https://img.shields.io/badge/Deploy-Vercel%20%2F%20Railway-orange)](https://vercel.com/)

**Friends Gola POS** is a modern, responsive Point of Sale system for small cafés/shops like gola stalls. Features PIN login, product management, order history, expenses, thermal printing, and mobile support (PWA).

## 🚀 Quick Start (Local)

1. **MongoDB Atlas**: Create free cluster → Get connection string (`mongodb+srv://...`)
2. **Backend** (`backend/`):
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Add MONGODB_URI, JWT_SECRET
   npm run dev  # http://localhost:5000 (auto-seeds products)
   ```
3. **Frontend** (`frontend/`):
   ```bash
   cd frontend  
   npm install
   cp .env.example .env  # Add VITE_API_URL=http://localhost:5000
   npm run dev  # http://localhost:5173 (PIN: 0000)
   ```

## 📁 Structure
```
.
├── backend/     # Node/Express API + MongoDB
├── frontend/    # React/Vite PWA + Thermal Print
└── README.md    ← You're here!
```

## 📖 Full Documentation
See [backend/README.md](backend/README.md) for:
- Detailed setup/deploy (Vercel/Railway)
- Thermal printer config
- API reference
- Security/testing

## 🌐 Live Demo
- Frontend: Vercel (easy PWA)
- Backend: Railway/Render (free tiers)

## Features
- ✅ Responsive (Mobile/Desktop/Tablet)
- ✅ PIN Login (default: 0000)
- ✅ Auto bill numbering/print
- ✅ Product/Expense/Order CRUD
- ✅ History & Summary
- ✅ PWA installable
- ✅ MongoDB Atlas ready

## Tech Stack
- **Frontend**: React 18, Vite, Axios, React Hot Toast
- **Backend**: Express 4, Mongoose 8, JWT, Helmet/CORS
- **DB**: MongoDB (Atlas free)
- **Print**: ESC/POS thermal (58/80mm)

---

⭐ **Star on GitHub if useful!**  
📱 **Test on mobile → Add to home screen**
