# Study Planner Webapp

A small full‑stack app to manage courses, find classmates, add friends, and chat. Built with React (Vite, TypeScript) on the client and Node.js/Express + SQLite on the server.

## Features

- Account registration and login (session-based)
- Profile with program, hobbies, and photo upload
- Manage your courses; see classmates in the same courses
- Send/accept/reject friend requests; unfriend
- Messaging between friends with a chat UI

## Tech Stack

- Client: Vite, React, TypeScript, React Router
- Server: Node.js, Express, express-session, SQLite, Multer
- DB: SQLite (auto-initialized and seeded on server start)

## Monorepo structure

```
client/   # React app (Vite)
server/   # Express API + SQLite database
```

Key server files:
- `server/server.js` – Express app, routes, session, static files
- `server/database.js` – Creates tables and seeds demo data (idempotent)
- `server/database.sqlite` – Local SQLite database file (ignored by Git)
- `server/public/images/` – User-uploaded images (ignored by Git; folder tracked via .gitkeep)

Key client files:
- `client/src/` – React app code (routes, context, API helper, styles)
- `client/vite.config.ts` – Dev server proxy `/api -> http://localhost:8039`

## Prerequisites

- Node.js 18+ recommended

## Setup & Run

Install client dependencies:

```
cd client
npm install
```

Start the client dev server (http://localhost:5173 by default):

```
npm run dev
```

Server dependencies are not committed to keep the repo small. Install them once in `server/`:

```
cd ../server
npm install express express-session sqlite3 multer
```

Start the server (port 8039):

```
node server.js
```

Notes:
- The database is created and seeded automatically on first server start by `server/database.js`.
- During development, the client proxy forwards `/api/*` to `http://localhost:8039` (see `client/vite.config.ts`). Use `/api` in client requests.
- Uploaded images are served from `server/public/images/`.

## Environment

For local development, the session secret is hard-coded for simplicity. For production, set it via environment variables and avoid committing secrets. Suggested variables:

```
SESSION_SECRET=change_this_in_production
PORT=8039
```

## Scripts (suggested, optional)

You may add these scripts to a future `server/package.json` for convenience:

```
{
	"scripts": {
		"start": "node server.js",
		"dev": "nodemon server.js"
	},
	"dependencies": {
		"express": "^4",
		"express-session": "^1",
		"multer": "^1",
		"sqlite3": "^5"
	}
}
```

## Folder hygiene

The root `.gitignore` excludes heavy/runtime files to keep the repo small:
- `node_modules/`, build outputs (`dist/`, `build/`)
- `.env` files (keep a `.env.example` if needed)
- `server/database.sqlite`, logs, and uploaded images

## License

See `LICENSE` for details.
