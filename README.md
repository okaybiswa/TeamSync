
# TeamSync

A team collaboration platform for managing workspaces, team conversations, channels, and project tasks in one place.

## Features

- User registration and login
- Workspace-based collaboration
- Channel-based messaging
- Task creation and management
- Kanban board with To Do, In Progress, and Done statuses
- Responsive user interface

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL

## Project Structure

```text
TeamSync/
├── client/       # Next.js frontend
└── server/       # Express backend
```

## Local Development

### Frontend

1. Navigate to the client directory.
2. Install dependencies using `npm install`.
3. Configure the API URL in `client/.env.local`.
4. Start the development server using `npm run dev`.

### Backend

1. Navigate to the server directory.
2. Install dependencies using `npm install`.
3. Configure the required environment variables.
4. Start the backend using `npm start`.

## Environment Variables

Configure secrets and connection strings in local environment files. Never commit real credentials to GitHub.

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Backend environment variables depend on the database and Prisma configuration used by the project.

## Deployment

The frontend, backend, and PostgreSQL database must be configured and deployed separately or through a platform that supports the complete application stack.

## License

No license has been selected yet.
