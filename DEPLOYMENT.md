# Production deployment

This repository deploys as two services: the `backend` API on Render and the `frontend` Vite application on Vercel.

## 1. Create the database

Create a MongoDB Atlas production cluster and add Render's outbound IPs (or temporarily allow all IPs while testing). Copy its `mongodb+srv://` connection string.

## 2. Deploy the API to Render

Create a new **Web Service** from this repository. Render detects `render.yaml`; otherwise use:

- Root directory: `backend`
- Build command: `npm ci`
- Start command: `npm start`
- Health check: `/api/health`

Set these environment variables in Render:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | A random secret of at least 32 characters |
| `JWT_EXPIRE` | `30d` |
| `CLIENT_URL` | Your Vercel production URL, for example `https://fintrack-ai.vercel.app` |
| `AI_API_KEY` | Optional Gemini API key |

After deployment, open `https://YOUR-RENDER-SERVICE.onrender.com/api/health`. It should return a healthy response.

## 3. Deploy the web app to Vercel

Import this repository into Vercel and configure:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`

Deploy, then copy the Vercel production URL into Render's `CLIENT_URL` and redeploy the Render service. If you use a custom domain, use that domain as `CLIENT_URL` instead.

`frontend/vercel.json` provides the SPA fallback required for direct navigation to routes such as `/dashboard`.

## Production notes

- Keep all real secrets only in Render/Vercel environment settings; never commit `.env` files.
- Public sign-ups always create standard users. Promote an administrator deliberately in MongoDB before relying on `/admin`.
- The API has security headers, compression, request-size limits, startup database checks, graceful shutdown, and request limits. Authentication endpoints are limited more strictly than the rest of the API.
