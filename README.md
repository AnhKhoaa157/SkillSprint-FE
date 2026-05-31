
# SkillSprint Web App UI

This is a code bundle for SkillSprint Web App UI. The original project is available at https://www.figma.com/design/d4gBJ36h54r8wv25j5dM20/SkillSprint-Web-App-UI.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Deploy on Vercel

This project is configured for Vercel with `vercel.json`.

### Option 1: Deploy from Vercel Dashboard

1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Vercel, click **Add New...** -> **Project**.
3. Import this repository.
4. Keep default build settings (Vercel will use `vercel.json`).
5. Click **Deploy**.

### Option 2: Deploy from CLI

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Deploy preview:

   ```bash
   vercel
   ```

3. Deploy production:

   ```bash
   vercel --prod
   ```

### Notes

- SPA routes are configured to fallback to `index.html`.
- Build output is `dist` (Vite default).
  