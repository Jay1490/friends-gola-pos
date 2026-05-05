# 🍨 Friends Gola POS - Full-Stack Point of Sale System

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-brightgreen)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-blue)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-brightblue)](https://mongodb.com/atlas)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel%20%2F%20Railway-orange)](https://vercel.com/)

---

## 📌 Overview

**Friends Gola POS** is a production-ready full-stack Point of Sale system designed for small businesses like gola stalls and cafés.
It supports billing, product management, expense tracking, order history, and thermal printing with a mobile-friendly PWA interface.

---

## ✨ Features

* 🔐 Secure PIN-based authentication
* 🧾 Automatic bill generation & thermal printing
* 📦 Product management (CRUD operations)
* 💰 Expense tracking system
* 📊 Order history & daily summary analytics
* 📱 Fully responsive (mobile, tablet, desktop)
* ⚡ Progressive Web App (installable on mobile)
* ☁️ Cloud database integration (MongoDB Atlas)

---

## ⚙️ Tech Stack

### Frontend

* React 18
* Vite
* Axios
* React Hot Toast

### Backend

* Node.js
* Express.js
* Mongoose
* JWT Authentication
* Helmet & CORS

### Database

* MongoDB Atlas

### Printing

* ESC/POS Thermal Printer (58mm / 80mm)

---

## 🔌 API Highlights

* RESTful API built using Express.js
* JWT-based authentication system
* CRUD operations for products, orders, and expenses
* Secure middleware implementation (Helmet, CORS)

---

## 🚀 Quick Start (Local Setup)

### 1. MongoDB Setup

* Create a free cluster on MongoDB Atlas
* Get connection string (`mongodb+srv://...`)

### 2. Backend Setup

```
cd backend
npm install
cp .env.example .env
```

Add:

```
MONGODB_URI=your_connection_string
JWT_SECRET=your_secret_key
```

Run:

```
npm run dev
```

Backend runs at: http://localhost:5000

---

### 3. Frontend Setup

```
cd frontend
npm install
cp .env.example .env
```

Add:

```
VITE_API_URL=http://localhost:5000
```

Run:

```
npm run dev
```

Frontend runs at: http://localhost:5173

Default PIN: **0000**

---

## 📂 Project Structure

```
friends-gola-pos/
├── backend/     # Express API + MongoDB
├── frontend/    # React + Vite (PWA)
└── README.md
```

---

## 🌐 Live Demo

Frontend: (Add your Vercel link here)
Backend: (Add your Railway / Render link here)

---

## 📸 Screenshots

(Add your UI screenshots here for better presentation)

---

## 🎯 Key Learnings

* Building full-stack applications using MERN architecture
* Designing RESTful APIs and secure authentication systems
* Integrating frontend with backend services
* Implementing real-world business logic (POS system)
* Handling deployment and cloud database integration

---

## 🚀 Future Improvements

* Add role-based authentication
* Advanced analytics dashboard
* Inventory alerts and reporting
* Payment gateway integration

---

## 👤 Author

Jay Patel
LinkedIn: https://linkedin.com/in/jay-patel-8b8b85275
GitHub: https://github.com/Jay1490

---

⭐ Star this repository if you find it useful
📱 Try installing as a PWA on your mobile device
