# 🖥️ Next.js Admin Dashboard

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE) 
[![Next.js](https://img.shields.io/badge/Next.js-13-blue)](https://nextjs.org/) 
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-blue)](https://tailwindcss.com/) 
[![Firebase](https://img.shields.io/badge/Firebase-Auth-yellow)](https://firebase.google.com/) 

A **modern, responsive admin dashboard** built with **Next.js**, **React**, and **Tailwind CSS**.  
Includes **Firebase authentication**, **AI chat integration**, **charts**, **tables**, and a **dark/light theme toggle**. Designed as a **starter template** for admin panels, analytics apps, or internal tools.

---

## Table of Contents

- [Features](#features)  
- [Project Structure](#project-structure)  
- [Demo](#demo)  
- [Getting Started](#getting-started)  
- [Authentication](#authentication)  
- [AI Chat Integration](#ai-chat-integration)  
- [Styling & Theme](#styling--theme)  
- [GitHub Workflow](#github-workflow)  
- [Deployment](#deployment)  
- [Contributing](#contributing)  
- [License](#license)  

---

## Features

- 🔒 **Protected routes** using Firebase authentication  
- 🖥️ **Responsive sidebar & topbar layout**  
- 🌙 **Dark/light theme toggle** with localStorage persistence  
- 📊 **KPI cards, charts (Recharts), and tables** for analytics  
- 🤖 **AI chat integration stub** (`callAiChat`)  
- 🎨 Tailwind CSS styling with modern design  
- ⚡ Ready for real backend/API integration  

---

## Project Structure

lms-ai-tutor/
├─ src/
│ ├─ app/
│ │ └─ layout.tsx # Main layout with sidebar & topbar
│ ├─ pages/
│ │ └─ dashboard/index.tsx # Dashboard page (client component)
│ ├─ components/
│ │ └─ LogoutButton.tsx # Logout button component
│ ├─ hooks/
│ │ └─ useAuth.ts # Custom auth hook
│ └─ lib/
│ └─ functionsClient.ts # AI chat backend calls
├─ firebase/
│ ├─ .firebaserc
│ ├─ firebase.json
│ ├─ firestore.rules
│ └─ firestore.indexes.json
├─ .env.local # Environment variables
├─ globals.css # Tailwind CSS styles
├─ package.json
└─ next.config.js

---

## Demo

> Will Insert screenshots or GIFs showing dashboard, dark mode, and AI chat here.  

Example flow:  
1. Admin signs in → `/dashboard`  
2. View KPIs, charts, and recent activity  
3. Toggle dark/light mode  
4. AI chat stub accepts prompts  

---

## Getting Started

### Prerequisites

- Node.js >= 18  
- npm or yarn  
- Firebase account for authentication and Firestore  

### Installation


# Clone the repo
git clone  https://github.com/kennedy7/elite-ai-tutor-dashboard.git
cd REPO

# Install dependencies
npm install
Environment Variables
Create a .env.local file in the root folder:

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
Running Locally

npm run dev
Open http://localhost:3000/dashboard in your browser.

Authentication
Uses hooks/useAuth.ts for managing authentication state

Redirects unauthenticated users to /auth/login

Firebase handles sign-in, sign-out, and session persistence

AI Chat Integration
lib/functionsClient.ts contains callAiChat() function

Sends prompts to an AI backend (Firebase function or serverless API)

Dashboard input accepts user prompts and displays responses

Styling & Theme
Tailwind CSS for all UI styling

Dark/light theme toggle using document.documentElement.classList.toggle('dark')

User preference persisted in localStorage

GitHub Workflow
Initial Push

git init
git add .
git commit -m "Initial commit — admin dashboard scaffold"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
Feature Branch Workflow

# Create a new feature branch
git checkout -b feature/feature-name

# Stage and commit changes
git add .
git commit -m "Add feature-name: brief description"

# Push to GitHub
git push origin feature/feature-name

# Open a Pull Request → Review → Merge into main
Updating Local Repo

git checkout main
git pull origin main
Deployment
Compatible with Firebase Hosting or Render

Add environment variables via the hosting provider dashboard

Trigger deployment on merge to main

Contributing
Fork the repository

Create feature branches for new work

Open Pull Requests with clear descriptions

Follow the code style and Tailwind conventions

License
MIT License © [KENNEDY HILLARY]
