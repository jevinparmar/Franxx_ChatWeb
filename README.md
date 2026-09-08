# Franxx ChatWeb 💬

A modern, real-time web-based chat application built with **React**, **Node.js / Express**, **Socket.io**, and **MongoDB Atlas**.

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
- 👥 **Group Chats:** Create and manage group conversations with admin controls.
- 📖 **Status Stories:** Ephemeral 24-hour status updates (auto-deleted via MongoDB TTL).
- 🔔 **Notifications:** Follow requests, group invites, and in-app alerts.

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
├── franxx/                  # Frontend Application (React + Vite)
│   ├── src/                 # React Components & Pages
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration
│
├── franxx_backend/          # Backend API Server (Node.js + Express)
│   ├── config/              # Database & Socket configuration
│   ├── controllers/         # Route logic & controllers
│   ├── middleware/           # Custom auth & error middleware
│   ├── models/              # Mongoose schemas/models (source of truth)
│   ├── routes/              # Express API endpoints
│   ├── uploads/             # User-uploaded files/media
│   ├── utils/               # Token generation & email service
│   ├── server.js            # Entry point for backend server
│   ├── package.json         # Backend dependencies
│   └── .env.example         # Environment variable template
│
├── database/                # Database documentation & setup
│   ├── README.md            # Full MongoDB schema documentation
│   ├── seeds/               # Safe demo/sample data (JSON)
│   │   ├── users.json
│   │   ├── chats.json
│   │   ├── messages.json
│   │   └── notifications.json
│   └── scripts/
│       └── seed.js          # Idempotent database seed script
│
├── Report and PPT/          # Project report & presentation
├── .gitignore               # Git ignore rules
└── README.md                # Project documentation (this file)
```

---

## 🗄️ Database

This project uses **MongoDB Atlas** (cloud-hosted MongoDB) as its database.

- **6 Collections:** `users`, `chats`, `messages`, `notifications`, `searchhistories`, `statuses`
- **Full schema documentation:** See [`database/README.md`](database/README.md) for detailed field definitions, data types, indexes, relationships, and an entity-relationship diagram.
- **Mongoose models (source of truth):** Located in [`franxx_backend/models/`](franxx_backend/models/)

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v18+ recommended)
- npm
- A MongoDB Atlas account with a connection string (see [MongoDB Atlas Setup](#-mongodb-atlas-setup) below)

---

### **1. Clone the Repository**

```bash
git clone https://github.com/YOUR_USERNAME/Franxx_ChatWeb.git
cd Franxx_ChatWeb
```

---

### **2. Setup Backend**

```bash
cd franxx_backend
npm install
```

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit `franxx_backend/.env` and fill in your own values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE_NAME
JWT_SECRET=your_strong_random_secret_key
CLIENT_URL=http://localhost:5173
EMAIL_USER=               # Optional: Gmail address for OTP emails
EMAIL_PASS=               # Optional: Gmail App Password
```

> **Note:** If `EMAIL_USER` and `EMAIL_PASS` are not configured, the app will print OTP codes to the server console instead of sending emails. This is fine for development.

Start the backend server:

```bash
# Development mode (with auto-restart via nodemon)
npm run dev

# Production mode
npm start
```

The API server will run on `http://localhost:5000`.

---

### **3. Setup Frontend**

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

### **4. (Optional) Seed Demo Data**

To populate the database with safe demo users and sample conversations:

```bash
cd franxx_backend
npm run db:seed
```

This creates 3 demo accounts you can use to test the application:

| Username | Password | Role |
|----------|----------|------|
| `alice_demo` | `DemoPass@123` | user |
| `bob_demo` | `DemoPass@123` | user |
| `charlie_demo` | `DemoPass@123` | user |

> **Safe & Idempotent:** The seed script uses `findOneAndUpdate` with `upsert: true`. Running it multiple times will NOT create duplicates or affect existing data.

---

## 🌐 MongoDB Atlas Setup

If you don't already have MongoDB Atlas configured, follow these steps:

1. **Create an Account:** Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up.
2. **Create a Free Cluster:** Click "Build a Database" → select the **Free Shared** tier → choose a region → click "Create Cluster".
3. **Create a Database User:** Go to **Database Access** → **Add New Database User** → set a username and password → grant "Read and write to any database" permissions.
4. **Configure Network Access:** Go to **Network Access** → **Add IP Address** → click "Allow Access from Anywhere" (for development).
5. **Get Connection String:** Go to **Database** → click **"Connect"** → select **"Connect your application"** (Driver: Node.js) → copy the connection string.
6. **Configure `.env`:** Paste the connection string into `franxx_backend/.env` as `MONGO_URI`. Replace `<password>` with your database user's password.
7. **Start the App:** Run `npm run dev` in the backend. The application will automatically create all required collections on first connection.
8. **(Optional) Seed Data:** Run `npm run db:seed` in the backend to load demo data.

---

## 📜 License

ISC