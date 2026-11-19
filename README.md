# techno_buildathonProject

DocuPing — a document vault with OCR auto-tagging, expiry tracking and reminders.

- `frontend/` — vanilla HTML/CSS/JS
- `backend/` — Express + Mongoose API

## Run locally

### Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running), used for MongoDB
- Node.js with npm
- Python 3, used to serve the frontend
- macOS or Linux shell (on Windows, use WSL or Git Bash)

### Start everything

From the project root:

```bash
./run-local.sh
```

Then open:

| Page | URL |
|---|---|
| Sign up | http://127.0.0.1:5500/pages/signup.html |
| Log in | http://127.0.0.1:5500/pages/login.html |
| My Vault | http://127.0.0.1:5500/pages/my-vault.html |
| API | http://localhost:5000/api |

The local database starts empty, so sign up for a new account the first time.

Press **Ctrl+C** to stop the backend and frontend. MongoDB keeps running so your data is ready next time. To stop it too, start with:

```bash
./run-local.sh --stop-db
```

or stop it later with `docker stop docuping-mongo`.

### What the script does

1. Checks that Docker, Node.js, npm and Python 3 are available, and that ports 5000 and 5500 are free.
2. Starts MongoDB in a Docker container named `docuping-mongo` on `127.0.0.1:27017` (created on first run). Data is kept in the `docuping-mongo-data` Docker volume.
3. Creates `backend/.env` if it doesn't exist:
   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/docuping_local
   JWT_SECRET=<random value>
   ```
   An existing `backend/.env` is left as is (with a warning if its `MONGO_URI` isn't local). The file is git-ignored.
4. Runs `npm ci` in `backend/` if `node_modules` is missing.
5. Starts the backend on port 5000 and the frontend on port 5500, with logs prefixed `[backend]` and `[frontend]`.

### Which backend the frontend uses

`frontend/js/config.js` picks the API automatically:

- Opened from `localhost` or `127.0.0.1` → `http://localhost:5000/api`
- Anywhere else → the Render production API

No config change is needed before committing or deploying.

### Troubleshooting

- **"Port 5000/5500 is already in use"** — another copy is running. Find it with `lsof -iTCP:5000 -sTCP:LISTEN` and stop it.
- **"Docker is not running"** — open Docker Desktop and wait until it's ready.
- **Preview says "Document file is missing on the server"** — uploaded files are stored on the backend's disk, not in MongoDB. Upload the document again on the backend you're using.
- **Start from a clean database** — `docker rm -f docuping-mongo && docker volume rm docuping-mongo-data`, then run the script again.

## Deploy

| Part | Host | How it deploys |
|---|---|---|
| Frontend (`frontend/`) | Vercel | Static site, no build step. |
| Backend (`backend/`) | Render | Express API. Uses `MONGO_URI` and `JWT_SECRET` from Render's Environment settings. |

Merging to `main` redeploys both automatically.

**How Vercel finds the frontend.** The config works with any Vercel **Root Directory** setting:

| Root Directory | Config used |
|---|---|
| `backend` (current) | `backend/vercel.json` copies `../frontend` into `vercel-static/` and serves it. `.vercelignore` hides every other backend file so Vercel never runs the Express app. |
| blank (repo root) | Root `vercel.json` serves `frontend/`. |
| `frontend` (cleanest) | Served directly; no config needed. |

Changing Root Directory to `frontend` in Vercel → Settings → Build and Deployment is the simplest setup; the files above keep the current setting working too.

Don't deploy the backend to Vercel: it stores uploads on disk and runs OCR, which Vercel's read-only serverless functions can't do (this causes `500 FUNCTION_INVOCATION_FAILED`).
