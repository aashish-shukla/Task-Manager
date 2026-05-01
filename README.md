# ⚡ TaskFlow — Team Task Manager

A full-stack collaborative task management web application built with Node.js, Express, MongoDB, and vanilla JavaScript. Features role-based access control (Admin/Member), project management, Kanban task boards, and an analytics dashboard.

## 🚀 Live Demo

**Live URL**: [https://task-manager-production-5869.up.railway.app](https://task-manager-production-5869.up.railway.app)

## 📸 Features

- **User Authentication** — Signup/Login with JWT-based security
- **Project Management** — Create projects, add/remove team members
- **Kanban Task Board** — Drag tasks across To Do → In Progress → Done
- **Role-Based Access** — Admins manage everything; Members update assigned tasks
- **Dashboard Analytics** — Task status charts, tasks per user, overdue tracking
- **Responsive Design** — Works on desktop and mobile

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose ODM |
| Auth | JWT (jsonwebtoken, bcryptjs) |
| Charts | Chart.js |
| Deployment | Railway |

## 📁 Project Structure

```
Task_Manager/
├── server/
│   ├── config/db.js           # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   └── roleCheck.js       # Role-based access
│   ├── models/
│   │   ├── User.js, Project.js, Task.js
│   ├── controllers/
│   │   ├── authController.js, projectController.js
│   │   ├── taskController.js, dashboardController.js
│   └── routes/
│       ├── auth.js, projects.js, tasks.js, dashboard.js
├── public/
│   ├── index.html, dashboard.html, projects.html, tasks.html
│   ├── css/style.css
│   └── js/api.js, app.js, auth.js, dashboard.js, projects.js, tasks.js
├── package.json
├── railway.toml
└── .env.example
```

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/aashish-shukla/Task-Manager.git
cd Task-Manager

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 4. Start development server
npm run dev

# 5. Open http://localhost:3000
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/task_manager` |
| `JWT_SECRET` | Secret key for JWT signing | `my-super-secret-key` |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |

## 🚢 Railway Deployment

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) and create a new project
3. Connect your GitHub repository
4. Add a **MongoDB** plugin from the Railway dashboard
5. Set environment variables in Railway:
   - `JWT_SECRET` — generate a random secret
   - `JWT_EXPIRES_IN` — `7d`
   - `MONGODB_URI` — auto-injected by Railway MongoDB plugin
6. Deploy — Railway auto-detects the `railway.toml` config
7. Your app is live at the generated Railway URL!

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List user's projects |
| GET | `/api/projects/:id` | Get project detail |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |
| DELETE | `/api/projects/:id` | Delete project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create task (Admin) |
| GET | `/api/tasks?project=:id` | List tasks |
| GET | `/api/tasks/:id` | Get task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (Admin) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get analytics |

## 👥 Roles

- **Admin**: Full access — create/edit/delete tasks, manage members
- **Member**: View and update status of assigned tasks only

## 📸 Screenshots

### Login Page
Clean, modern authentication interface with glassmorphism design.

### Dashboard
Real-time analytics with Chart.js — task distribution, per-user breakdown, and overdue tracking.

### Kanban Board
Drag-friendly task cards organized by status columns (To Do → In Progress → Done).

### Project Management
Create projects, manage team members with role-based access control.

## 📄 License

MIT
