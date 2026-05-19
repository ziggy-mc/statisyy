# statisy

Next.js 16 scaffold with TypeScript, App Router, and Tailwind CSS v4.

## Required environment variables

- `MONGODB_URI`: MongoDB connection URI (`mongodb://` or `mongodb+srv://`).
- `MONGODB_DB_NAME`: MongoDB database name.
- `SESSION_SECRET`: signing secret for session tokens (minimum 32 characters).
- `CSRF_SECRET` (optional): signing secret for CSRF tokens (minimum 32 characters). If omitted, `SESSION_SECRET` is used.
