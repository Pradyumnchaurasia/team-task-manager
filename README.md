# 🚀 Team Task Manager - Full-Stack Application

Team Task Manager is a premium, secure, and beautiful Full-Stack application designed to facilitate seamless project collaboration. The application enforces **Role-Based Access Control (RBAC)** allowing users to operate with **Admin** or **Member** privileges.

The interface is styled entirely in **Vanilla CSS** with a stunning dark-glassmorphism theme, glowing neon accents, and responsive layout structures, avoiding bulky styling frameworks entirely.

---

## 🛠️ Technology Stack

* **Frontend**: React.js (scaffolded with Vite)
* **Styling**: Native Vanilla CSS (CSS Grid, Flexbox, Custom Transitions, CSS variables, Google Fonts: Outfit)
* **Backend**: Node.js & Express.js REST API
* **Database**: SQLite (Local development) / PostgreSQL (Seamless switch for Railway Production)
* **ORM**: Prisma Client & Migrate
* **Security & Auth**: Secure bcrypt password hashing, JWT (JSON Web Tokens), and custom Express middleware for RBAC checks

---

## ✨ Features

### 1. Secure Authentication & Authorization (RBAC)
* Secure **Signup & Login** flows verifying credentials and password lengths.
* **Role assignment**: First registered account defaults to `ADMIN`; others register as `MEMBER` (role selection dropdown added for local testing convenience).
* Secure **JWT Session Verification** stored in localized state with header injections.

### 2. Multi-Level Management
* **Projects CRUD (Admin Only)**: Only Administrators can create or delete projects. They can assign a name, description, and list of initial members.
* **Team Invitations (Admin Only)**: Admins can dynamically invite or remove members inside the project workspace team panel.
* **Task Board**: 4-column Kanban board (**To Do**, **In Progress**, **Review**, **Completed**) with quick arrow shifting status adjustments and modal edit parameters.

### 3. Interactive Visual Dashboard
* **Metrics Summary**: Real-time counting metrics tracking active projects, pending tasks, completed tasks, and critical **Overdue** tasks.
* **Filter Lists**: Quick sorting selectors (All Urgent, Overdue Only, Assigned to Me).
* **Workspace Directory**: Direct access to assigned project workspaces with search features.

### 4. Admin Control Panel (Admin Only)
* Monitor system-wide details (total accounts, admins, members).
* **Account Directory**: Inline role adjustments toggling users between `MEMBER` and `ADMIN`.
* **Self-Lockout Protection**: Prevents active Administrators from changing their own role.

---

## 📊 Database Relationships

Our SQL schema is designed with structured data relationships inside `backend/prisma/schema.prisma`:
* **User ↔ Project (Ownership)**: One-to-Many (`User` can own many `Projects`).
* **User ↔ Project (Membership)**: Many-to-Many (`User` can belong to many `Projects` as team members; `Project` can contain many team members).
* **Project ↔ Task (Containment)**: One-to-Many (`Project` contains many `Tasks`). Deleting a project cascades and deletes all its tasks.
* **User ↔ Task (Assignment)**: One-to-Many (`User` can be assigned many `Tasks`). Removing a user from a project team automatically unassigns their tasks within that project.

---

## 🚀 Local Development Setup

To run this application locally, you will need **Node.js** and **npm** installed on your system.

### Step 1: Set up the Backend
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Set up the local environment variables in a `.env` file (one has been pre-configured for you):
   ```env
   DATABASE_URL="file:./dev.db"
   PORT=5000
   JWT_SECRET="super-secret-task-manager-token-key-12345"
   NODE_ENV="development"
   ```
4. Run the initial database migration to create the SQLite database:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed the database with default accounts and projects for quick testing:
   ```bash
   npm run db:seed
   ```
6. Launch the Express REST API development server:
   ```bash
   npm run dev
   ```
   The backend API will start listening at: `http://localhost:5000`

### Step 2: Set up the Frontend
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend application will start running at: `http://localhost:3000`

---

## 🔑 Default Login Credentials

Use these seeded credentials in the local database to explore **Admin** and **Member** views immediately:

### 👤 Administrator Account
* **Email**: `admin@taskmanager.com`
* **Password**: `Password123`
* **Privileges**: Create and Delete projects, Add/Remove project team members, CRUD tasks, Change user roles in the Admin Panel.

### 👤 Team Member Account
* **Email**: `member@taskmanager.com`
* **Password**: `Password123`
* **Privileges**: View assigned projects, Create/Edit tasks within project workspaces, shift task Kanban statuses, mark tasks as Done from the dashboard.

---

## 📦 Railway Production Deployment Guide

Deploying to **Railway** is simple as our configuration supports single environment swaps using PostgreSQL.

### 1. Database Provisioning
* In your Railway dashboard, click **New** -> **Database** -> **Provision PostgreSQL**.
* Once initialized, copy the database connection string: `postgresql://...`

### 2. Monorepo Setup (Single Service)
You can deploy both parts or the backend as the API service.
For the backend API service, set these environment variables in Railway:
* `DATABASE_URL` = *Paste your Railway PostgreSQL Connection URI here*
* `PORT` = `5000`
* `JWT_SECRET` = *A strong secure secret string*
* `NODE_ENV` = `production`

### 3. Production Database Migration
Under your service settings in Railway, add a build step or release command to automatically push the schema on deploy:
```bash
npx prisma db push
```

### 4. Deploying React Frontend
You can build the production assets using Vite and host it statically or deploy it on Railway by directing it to the `frontend` directory with:
* **Build Command**: `npm run build`
* **Start Command**: `npx serve -s dist -l 3000`
* Point the API requests to your live Railway REST API URL!
