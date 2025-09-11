Divine AI – Pastoral Ministry Platform

Overview
- Unified Node/Express server with Vite React client
- AI features via Gemini; audio via OpenAI (optional)
- Scripture data via API.Bible with graceful fallbacks where possible

Quick Start
- Copy `.env.example` to `.env` and set keys:
  - PORT=5000
  - GEMINI_API_KEY=your_gemini_api_key
  - OPENAI_API_KEY=your_openai_api_key (optional)
  - BIBLE_API_KEY=your_api_bible_key
  - BIBLE_DEFAULT_ID=de4e12af7f28f599-02 (NIV)
- Install deps: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Prod: `npm start`

Environment Variables
- PORT: HTTP port (defaults to 5000)
- GEMINI_API_KEY: Used by server/services/gemini.ts
- OPENAI_API_KEY: Used by server/services/audio-processor.ts (fallbacks gracefully)
- BIBLE_API_KEY: Used by server/services/bible-api.ts
- BIBLE_DEFAULT_ID: Default Bible for API.Bible requests (e.g., NIV `de4e12af7f28f599-02`)
- REQUIRE_AUTH=true to require login for API access (except public endpoints)
- SESSION_SECRET: secret for session signing (required if REQUIRE_AUTH=true)
- USE_DB=true and DATABASE_URL to enable Drizzle-backed persistence
- SHARE_TOKEN_SECRET: secret for signed share links
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, FROM_EMAIL for email delivery

API.Bible Integration
- Endpoints under `/api/bibles/*` wrap API.Bible v1 for easy consumption by the client:
  - `GET /api/bibles` – list bibles
  - `GET /api/bibles/:bibleId` – bible details
  - `GET /api/bibles/:bibleId/books` – list books
  - `GET /api/bibles/:bibleId/books/:bookId` – book details
  - `GET /api/bibles/:bibleId/books/:bookId/chapters` – chapters in a book
  - `GET /api/bibles/:bibleId/chapters/:chapterId` – chapter content (plain text)
  - `GET /api/bibles/:bibleId/chapters/:chapterId/verses` – verses in a chapter
  - `GET /api/bibles/:bibleId/verses/:verseId` – verse by ID (plain text)
  - `GET /api/bibles/:bibleId/passages/:passageId` – passage content (plain text)
  - `GET /api/bibles/:bibleId/verse-by-reference?ref=John%203:16` – resolve a human reference
  - `GET /api/bibles/:bibleId/search?query=love&limit=20` – search within a bible

Client Features
- Scripture Engine (`client/src/components/scripture-engine.tsx`):
  - Search using API.Bible search endpoint
  - Navigator: Bible → Book → Chapter, with chapter verses
  - Cross-references and AI commentary panes
  - Deep links: URL hash (e.g., `#JHN.3.16`) selects verse and auto-scrolls
  - Passage toolbar: Copy verse link, Scroll to verse

Notes
- In development, the server runs Vite middleware. In production, build first; server serves static from `dist/public`.
- If `BIBLE_API_KEY` is missing, some scripture features will degrade; server logs a warning at startup.
