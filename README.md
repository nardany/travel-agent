# Armenia Travel Agent

An AI travel assistant that helps people plan trips in Armenia. It answers in the
user's language (Armenian, English, Russian), remembers every conversation, and
keeps each user's data private.

## Features

- **AI chat** powered by Gemini, focused on travel in Armenia
- **Authentication** with email and password (Better Auth), passwords stored as hashes
- **Private conversations** — each user sees only their own chats
- **Persistent history** stored in PostgreSQL and loaded on the server
- **Auto-generated titles** — an LLM names each conversation, in parallel with the reply
- **Recent first** — conversations are sorted by last activity
- **Server-side validation** with Zod and meaningful status codes (400, 401, 404, 502)

## Tech Stack

- **Next.js** (App Router, Server Components) and **TypeScript**
- **PostgreSQL** with **Drizzle ORM** and versioned migrations
- **Better Auth** for authentication and sessions
- **Gemini API** for chat and title generation
- **Docker Compose** for the local database
- **Zod** for request validation
- **Tailwind CSS**

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop
- A Gemini API key

### Setup

1. Clone the repository

   ```bash
   git clone https://github.com/nardany/travel-agent.git
   cd travel-agent
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create your environment file and fill in the values

   ```bash
   cp .env.example .env.local
   ```

   Generate `BETTER_AUTH_SECRET` with:

   ```bash
   openssl rand -base64 32
   ```

4. Start the database

   ```bash
   docker compose up -d
   ```

5. Create the tables

   ```bash
   npx drizzle-kit migrate
   ```

6. Run the app

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 and create an account at `/login`.

## Project Structure

```
app/
├── (chat)/              # Protected pages with the conversations sidebar
│   ├── layout.tsx       # Checks the session, redirects to /login
│   ├── page.tsx         # New conversation
│   └── chat/[id]/       # Existing conversation, loaded from the database
├── login/               # Sign up and sign in
└── api/
    ├── chat/            # Chat endpoint: validation, history, Gemini, titles
    └── auth/[...all]/   # Better Auth handler
components/              # Chat, Sidebar, SignOutButton
db/
├── schema.ts            # conversations, messages, tool_calls
├── auth-schema.ts       # users, sessions, accounts (Better Auth)
└── queries.ts           # All database queries in one place
lib/
├── gemini.ts            # Gemini API client
├── auth.ts              # Better Auth server config
├── auth-client.ts       # Better Auth browser client
└── session.ts           # Current user from the session cookie
drizzle/                 # SQL migrations
```

## Roadmap

- [ ] Streaming responses
- [ ] Tools: weather for Armenian cities, AMD exchange rates
- [ ] Agent loop with retries and timeouts
- [ ] User approval before bookings, idempotent booking requests
- [ ] Knowledge base about Armenian destinations (RAG with pgvector)
- [ ] Evals for agent quality
- [ ] Production deployment with CI