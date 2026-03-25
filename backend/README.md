# WorkChain Pro - Backend

This folder contains the Node.js Express API and PostgreSQL database configuration for WorkChain Pro.

## Setup Instructions

### 1. Database Configuration
You need a running PostgreSQL database. 
1. Open the `.env` file in the `backend` folder.
2. Update the `DATABASE_URL` with your actual Postgres credentials. 
Default: `postgresql://postgres:postgres@localhost:5432/workchain?schema=public`

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize the Database
Push the Prisma schema to your PostgreSQL database. This automatically creates the `Job` table:
```bash
npx prisma db push
```
*(Optional) Generate the Prisma client if not done automatically:*
```bash
npx prisma generate
```

### 4. Start the Server
Run the backend API locally on port 5000:
```bash
npm run dev
```

## API Endpoints
- `GET /api/jobs`: Fetch all jobs from Postgres.
- `POST /api/jobs`: Create a new job. 

## Note
The React Frontend (`../frontend/src/pages/Jobs.jsx`) will attempt to fetch from `http://localhost:5000/api/jobs`. If it fails (e.g., if you haven't started this server), the frontend will gracefully fall back to placeholder development data.
