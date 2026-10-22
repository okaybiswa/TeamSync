# TeamSync

**A collaborative workspace for teams to communicate, organize tasks, and keep projects moving.**

TeamSync is a full-stack team collaboration platform built to bring workspace management, channel-based conversations, and task tracking into one place. The project focuses on a clean, responsive interface and a practical workflow for teams working together.

🌐 **Live Demo:** [TeamSync](https://teamsync-okaybiswa.vercel.app)  
💻 **Repository:** [okaybiswa/TeamSync](https://github.com/okaybiswa/TeamSync)

## Features

- **User Authentication** — Register an account and log in to access your workspace.
- **Workspace Management** — Create and organize separate workspaces for teams or projects.
- **Channel-Based Messaging** — Keep team conversations organized by channel.
- **Task Management** — Create tasks and update their status as work progresses.
- **Kanban Board** — Track tasks across To Do, In Progress, and Done.
- **Responsive UI** — Work with a layout designed for different screen sizes.

## Tech Stack

| Area | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |

## Project Structure

```text
TeamSync/
├── client/       # Next.js frontend
└── server/       # Express API and database integration
```

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL database
- Git

### 1. Clone the repository

```bash
git clone https://github.com/okaybiswa/TeamSync.git
cd TeamSync
```

### 2. Set up the backend

```bash
cd server
npm install
```

Configure the backend environment variables required by your database and Prisma setup, then start the server:

```bash
npm start
```

The backend uses port `5000` by default when no other port is configured.

### 3. Set up the frontend

Open a second terminal from the project root:

```bash
cd client
npm install
```

Create `client/.env.local` and configure the backend URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Make sure the PostgreSQL connection and the backend's required environment variables are configured before running the application. Keep local environment files and credentials out of version control.

## Deployment

TeamSync is deployed using the following services:

- **Frontend:** Vercel
- **Backend API:** Render
- **Database:** PostgreSQL hosted on Render

The frontend communicates with the backend through the `NEXT_PUBLIC_API_URL` environment variable. Configure the appropriate URL for each environment before deploying.

## Development Status

The core workspace, messaging, and task-management workflows are implemented and deployed. Further development is planned around authentication security, role-based permissions, workspace administration, and dashboard improvements.

## License

No open-source license has been selected yet. All rights are reserved unless a license is added to the repository.
