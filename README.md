# Franxx ChatWeb 💬

A modern, real-time web-based chat application built with **React**, **Node.js / Express**, **Socket.io**, and **MongoDB**. 

---

## 👥 Project Team & Credits

- **Group Members:**
  - Jevin Parmar
  - Aryan Kapadiya
  - Savan Detroja
- **Guide:**
  - Jaypalsinh Gohel Sir

---

## ✨ Features

- ⚡ **Real-time Messaging:** Powered by Socket.io for instant message delivery and active user presence.
- 🔐 **Authentication & Security:** JWT (JSON Web Token) authentication with password hashing using bcrypt.
- 📁 **Media & File Sharing:** Upload and share images and media files seamlessly.
- 🎨 **Responsive UI:** Modern React frontend built using Vite with interactive emoji support (`emoji-mart`).
- 📧 **Email Notifications:** Integrated with `nodemailer` for user communications/verification workflows.

---

## 🛠️ Tech Stack

### **Frontend (`/franxx`)**
- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **Icons & UI:** React Icons, Emoji-mart
- **Real-Time Client:** Socket.io-client
- **HTTP Client:** Axios

### **Backend (`/franxx_backend`)**
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js (v5)
- **Database:** MongoDB Atlas via Mongoose
- **Real-Time Server:** Socket.io
- **File Storage:** Multer (Local storage `/uploads`)
- **Mail Service:** Nodemailer

---

## 📂 Project Structure

```text
Franxx_ChatWeb/
├── franxx/               # Frontend Application (React + Vite)
│   ├── src/              # React Components & Pages
│   ├── public/           # Static assets
│   ├── package.json      # Frontend dependencies
│   └── vite.config.js    # Vite configuration
│
├── franxx_backend/       # Backend API Server (Node.js + Express)
│   ├── config/           # Database & Socket configuration
│   ├── controllers/      # Route logic & controllers
│   ├── middleware/       # Custom auth & error middleware
│   ├── models/           # Mongoose schemas/models
│   ├── routes/           # Express API endpoints
│   ├── uploads/          # User-uploaded files/media
│   ├── server.js         # Entry point for backend server
│   └── package.json      # Backend dependencies
│
└── README.md             # Project documentation
```

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB connection string (MongoDB Atlas or Local Instance)

---

### **1. Setup Backend**

```bash
cd franxx_backend
npm install
```

Create a `.env` file inside `franxx_backend` based on `.env.example`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```

Start the backend server:

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

---

### **2. Setup Frontend**

```bash
cd ../franxx
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The client application will run on `http://localhost:5173`.

---

## 📜 License

ISC