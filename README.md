
# Study Planner Webapp

A small full‑stack app to manage courses, find classmates, add friends, and chat. Built with React (Vite, TypeScript) on the client and Node.js/Express + SQLite on the server.

## Features

- Account registration and login (session-based)
- Profile with program, hobbies, and photo upload
- Manage your courses; see classmates in the same courses
- Send/accept/reject friend requests; unfriend
- Messaging between friends with a chat UI

## Tech Stack

- **Client**: Vite, React, TypeScript, React Router  
- **Server**: Node.js, Express, express-session, SQLite, Multer  
- **Database**: SQLite (auto-initialized and seeded on server start)  
- **Monorepo structure**  

### Key server files

- `server.js` – Express app, routes, session, static files  
- `database.js` – Creates tables and seeds demo data (idempotent)  
- `database.sqlite` – Local SQLite database file (ignored by Git)  
- `images/` – User-uploaded images (ignored by Git; folder tracked via `.gitkeep`)  

### Key client files

- `src/` – React app code (routes, context, API helper, styles)  
- `vite.config.ts` – Dev server proxy `/api` → `http://localhost:8039`  

## Prerequisites

- Node.js 18+ recommended

## Setup & Run

### Client

```bash
cd client
npm install
npm run dev
```

Client runs on [http://localhost:5173](http://localhost:5173) by default.

### Server

Server dependencies are not committed to keep the repo small. Install them once in the server folder:

```bash
cd server
npm install
npm start
```

Server runs on port `8039`.

### Notes

* The database is created and seeded automatically on first server start by `database.js`.
* During development, the client proxy forwards `/api/*` to `http://localhost:8039` (see `vite.config.ts`). Use `/api` in client requests.
* Uploaded images are served from `images/`.

## Environment

For local development, the session secret is hard-coded for simplicity. For production, set it via environment variables and avoid committing secrets. Suggested variables:

```text
SESSION_SECRET=your_secret_here
PORT=8039
```

## Folder Hygiene

The root `.gitignore` excludes heavy/runtime files to keep the repo small:

* `node_modules/`, build outputs (`dist/`, `build/`)
* `.env` files (keep a `.env.example` if needed)
* `database.sqlite`, logs, and uploaded images

## License

See `LICENSE` for details.



```
