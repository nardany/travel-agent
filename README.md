# Armenia Travel Agent

An AI travel assistant that helps people plan trips in Armenia. It answers in the
user's language (Armenian, English, Russian), uses real data through tools,
remembers every conversation, and keeps each user's data private.

## Features

- **AI agent** powered by Gemini through the Vercel AI SDK, focused on travel in Armenia
- **Streaming responses** with a Stop button; partial answers are saved
- **Tools with real data:**
  - weather forecast for Armenian cities (Open-Meteo, 7 days)
  - currency exchange rates and conversion
- **Tool cards in the chat**, restored from the database after reload
- **Authentication** with email and password (Better Auth), passwords stored as hashes
- **Private conversations** — each user sees only their own chats
- **Persistent history** — messages and tool calls stored in PostgreSQL
- **Auto-generated titles** — an LLM names each conversation, in parallel with the reply
- **Recent first** — conversations are sorted by last activity
- **Server-side validation** with Zod and meaningful status codes (400, 401, 404, 502)
- **Manual evals** — 10 test cases with expected behavior, tracked across runs

## Tech Stack

- **Next.js** (App Router, Server Components) and **TypeScript**
- **Vercel AI SDK** for streaming and tool calling
- **Gemini API** as the model
- **PostgreSQL** with **Drizzle ORM** and versioned migrations
- **Better Auth** for authentication and sessions
- **Docker Compose** for the local database
- **Zod** for request and tool input validation
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
│   └── chat/[id]/       # Existing conversation with tool calls, loaded from the database
├── login/               # Sign up and sign in
└── api/
    ├── chat/            # Streaming chat endpoint: auth, validation, tools, saving
    └── auth/[...all]/   # Better Auth handler
components/
├── Chat.tsx             # Chat UI with useChat
├── WeatherCard.tsx      # Weather tool result
├── ExchangeCard.tsx     # Exchange rate tool result
├── Sidebar.tsx
└── SignOutButton.tsx
db/
├── schema.ts            # conversations, messages, tool_calls
├── auth-schema.ts       # users, sessions, accounts (Better Auth)
└── queries.ts           # All database queries in one place
lib/
├── prompts.ts           # System and title prompts
├── weather.ts           # Open-Meteo client
├── exchange.ts          # Exchange rate client
├── gemini.ts            # Gemini client for titles
├── auth.ts              # Better Auth server config
├── auth-client.ts       # Better Auth browser client
└── session.ts           # Current user from the session cookie
evals/
└── manual.md            # Test cases and results across runs
drizzle/                 # SQL migrations
```

## Roadmap

- [x] Streaming responses
- [x] Tools: weather for Armenian cities, exchange rates
- [x] Manual evals
- [ ] Tool failure simulation, retries and timeouts
- [ ] Parallel tool calls with concurrency limits
- [ ] Own agent loop
- [ ] Inquiry drafts to tour companies with user approval, idempotent requests
- [ ] Knowledge base about Armenian destinations (RAG with pgvector)
- [ ] Automated evals
- [ ] Production deployment with CI