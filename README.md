# Mosaic Studio

Browser-based design editor with local project storage, templates, editable canvas elements, export tools, an approval-before-apply AI edit planner, and optional room-based collaboration.

## Current status
The editor and server routes are in the repository. AI and cloud collaboration require credentials and a configured Supabase database; those services are not provisioned by this repository. A successful static page load alone does not verify full-stack readiness.

## Deploy to Vercel
1. Import this GitHub repository into Vercel; use the repository root.
2. Add the environment variables below in Vercel Project Settings.
3. Create a Supabase project and run `supabase/migrations/001_mosaic_collaboration.sql` in its SQL Editor.
4. Redeploy and test the AI and collaboration flows using the checklist below.

### Environment variables
- `OPENAI_API_KEY`: required for AI design planning.
- `OPENAI_MODEL`: optional; defaults to `gpt-4.1-mini`.
- `SUPABASE_URL`: required for collaboration.
- `SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_ANON_KEY`): returned to the browser for Supabase Realtime.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only database access. Never expose this in client code or a public variable.

### AI
The AI endpoint returns a constrained design-edit plan and validates operation types, colors, and element IDs. The user reviews and approves the plan before changes are applied. Missing credentials produce an explicit error.

### Collaboration
The API stores shared documents and version history in Supabase. Invite links are bearer credentials: anyone with a valid link can read and edit that room. This initial version does not provide user accounts or per-user permissions. Realtime broadcasts use a room-specific derived channel name; treat invite links as secrets.

## Local checks
Requires Node.js 20+. Run `npm run check` and `npm test`. The HTML editor can be opened in a browser, but server routes require Vercel's local runtime (for example `npx vercel dev`).

## Production checklist
- [ ] Verify editor loads with no console errors.
- [ ] Create/edit a design, reload, and verify local storage persistence.
- [ ] Test every visible export format and inspect output.
- [ ] Configure AI key; generate a plan, cancel it, then approve a plan.
- [ ] Apply the Supabase migration; configure the three Supabase variables.
- [ ] Open one collaboration room in two browsers; verify presence, edits, checkpoint, and restore.
- [ ] Verify no secret key is present in browser requests, frontend source, or git history.
- [ ] Set AI usage limits and review data retention/privacy before inviting users.

This project is not feature-equivalent to Canva. Account-based workspaces, billing, background removal, video editing, and team administration are not included. Local designs remain in browser storage unless shared through a room.
