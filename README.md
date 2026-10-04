# 💰 Finance System

A full-stack **Finance Management System** built with the **MERN stack** that helps users track income and expenses, analyze spending patterns, and receive **AI-powered financial insights using Google Gemini**.

## 🚀 Features

* 🔐 User authentication and authorization
* 💰 Track income and expenses
* 📊 View financial summaries and spending analytics
* 📈 Categorize and monitor transactions
* 🤖 Gemini AI-powered financial insights
* 💡 Personalized spending and savings suggestions
* 📱 Responsive user interface
* 🔒 Secure backend APIs and environment variables

##  Tech Stack

**Frontend**

* React.js
* JavaScript
* HTML5 / CSS3
* Axios

**Backend**

* Node.js
* Express.js
* REST APIs
* JWT Authentication

**Database**

* MongoDB
* Mongoose

**AI**

* Google Gemini API

**Deployment**

* Vercel — Frontend
* Render — Backend

##  Project Structure

```text
Finance-System/
├── frontend/
│   ├── src/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── package.json
│
└── README.md
```

##  Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

### 2. Install dependencies

**Frontend**

```bash
cd frontend
npm install
```

**Backend**

```bash
cd ../backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the backend directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Do **not** commit `.env` to GitHub.

### 4. Start the backend

```bash
cd backend
npm start
```

### 5. Start the frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

The application will be available at the local URL shown by Vite.

## 📸 Screenshots

### Dashboard

![Dashboard](screenshots/dashboard.png)

### Transactions

![Transactions](screenshots/transactions.png)

### AI Financial Insights

![AI Insights](screenshots/ai-insights.png)

## 🌐 Live Demo

**Finance System:**
https://finance-tracker-bie8iiiff-prajwal7ps-projects.vercel.app/

## 🔐 Security

* API keys and secrets are stored in environment variables.
* Authentication is handled using JWT.
* Sensitive credentials are excluded from the public repository.

## 👨‍💻 Author

**Prajwal P**

Built as a full-stack MERN project with AI-powered financial insights.
