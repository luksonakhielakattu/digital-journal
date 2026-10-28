# Digital Journal — Personal Diary & Mood Tracking System
### Web Technology IA3 Individual University Project

---

## 1. Project Abstract

In today's fast-paced digital environment, maintaining mental clarity, emotional awareness, and consistent self-reflection has become both essential and challenging. **Digital Journal** is an individual full-stack web application developed for the Web Technology IA3 curriculum. The system serves as a secure, personal digital sanctuary where users can chronicle their daily thoughts, track their emotional states across six curated mood categories, and visualize longitudinal emotional trends through dynamic database-driven analytics and an interactive calendar.

Built using an asynchronous **Node.js** and **Express.js** backend, **MongoDB with Mongoose ODM**, and a responsive **HTML5/CSS3/JavaScript (Bootstrap 5)** frontend, the application enforces robust session-based authentication with `connect-mongo` and `bcryptjs` password hashing. The project emphasizes clean software architecture, defensive server-side authorization, intuitive user experience, and comprehensive automated testing.

---

## 2. Problem Statement

Traditional paper journals offer intimacy and privacy but suffer from limitations:
1. **Lack of Searchability:** Locating a specific reflection, date, or emotional event requires manual skimming.
2. **No Longitudinal Emotional Insight:** Written text alone makes it difficult to recognize recurring emotional triggers, stress patterns, or seasonal mood shifts.
3. **Physical Fragility & Inconvenience:** Paper diaries can be misplaced, damaged, or accessed by unauthorized individuals.
4. **Existing Cloud Solutions Bloat & Monetize Privacy:** Commercial journaling apps often lock basic filtering behind paywalls, require heavy client frameworks, or track user metrics invasively.

**Digital Journal** solves these problems by providing an elegant, distraction-free, self-contained web platform that delivers rich text composition, dynamic analytics, visual calendar indexing, and absolute data isolation per user.

---

## 3. Project Objectives

1. **Academic Excellence:** Satisfy all individual Web Technology IA3 engineering requirements using standard server-side rendering/API architectures without client-side framework bloat.
2. **Complete CRUD Capabilities:** Implement Create, Read, Update, and Delete operations for journal entries with server-side and client-side validation.
3. **Multi-Dimensional Mood Tracking:** Categorize entries into 6 standardized moods (`Happy`, `Calm`, `Excited`, `Sad`, `Stressed`, `Grateful`) and aggregate distribution statistics dynamically.
4. **Defensive Authentication & Access Control:** Prevent unauthorized access using signed HTTP-only cookies, Express sessions stored in MongoDB, and rigorous per-entry ownership checks.
5. **Interactive Chronological Exploration:** Offer both a flexible searchable feed with multi-criteria filters and an intuitive monthly calendar grid.
6. **Automated Verification:** Guarantee software correctness via an automated integration test suite covering auth, entry CRUD, security boundaries, and dashboard statistics.

---

## 4. Key Features

- **Public Landing Page (`index.html`):** Welcoming presentation showcasing project objectives, interactive mood previews, and feature overviews.
- **Secure Authentication (`register.html` & `login.html`):**
  - Registration with full name, unique email, and hashed password.
  - Server-side rate-limiting against brute force attacks (`express-rate-limit`).
  - Session persistence across browser reloads via MongoDB session store.
- **Dynamic Dashboard (`dashboard.html`):**
  - Live statistics calculated in real-time: Total Entries, Entries Written Today, Starred Favorites, and Total Word Count.
  - Dominant mood calculation and visual distribution progress bars.
  - Recent reflections feed and starred quick-access cards.
- **Reflective Journal Editor (`editor.html`):**
  - 120-character title limit counter.
  - 6 interactive mood selection pills with emojis.
  - Real-time word counter, character counter, and estimated read time.
  - Comma-separated tag support and one-click favorite toggle.
  - Edit mode support with pre-filled inputs and permanent delete confirmation modal.
- **Search & Multi-Filter Entries Feed (`entries.html`):**
  - Instant debounced keyword search across titles and entry contents.
  - Filter by Mood (`Happy`, `Calm`, `Excited`, `Sad`, `Stressed`, `Grateful`).
  - Filter by Starred/Favorites status.
  - Filter by custom Date Ranges (Start Date to End Date).
  - Sort by Newest, Oldest, or Title (A–Z).
  - Full-screen Entry Detail modal with formatted text, word count, and quick edit links.
  - Inline favorite star toggling without page reload.
- **Interactive Calendar Grid (`calendar.html`):**
  - Standard 7-column monthly view (Sunday through Saturday).
  - Month navigation (Previous, Next, Today).
  - Color-coded mood badges and entry counters rendered on respective dates.
  - Day reflection inspector modal displaying all entries written on the clicked date.
- **User Profile & Account Settings (`profile.html`):**
  - Overview badge with initials avatar, email, join date, and lifetime entry count.
  - Update display name and personal journal motto/bio.
  - Secure password modification requiring current password verification.
  - Safe session termination / sign-out.

---

## 5. Technology Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3.3, Bootstrap Icons 1.11.3 | Semantic layouts, responsive grid, DOM manipulation, custom lavender design system |
| **Backend** | Node.js (v24.x / LTS), Express.js (v4.19.x) | Application runtime, modular REST API routing, static file hosting, session middleware |
| **Database** | MongoDB (v7.x / v8.x / Atlas), Mongoose ODM (v8.5.x) | Persistent document store, schemas, validation hooks, compound indexing, aggregation pipelines |
| **Authentication** | `bcryptjs`, `express-session`, `connect-mongo` | Salting & password hashing (10 rounds), session cookie generation, persistent MongoDB session storage |
| **Security & Utilities** | `express-rate-limit`, `dotenv` | Brute-force throttling on auth endpoints, environment variable decoupling |
| **Testing** | Node.js native test runner (`node --test`), `node:assert`, `supertest` | Automated API integration test suite executing against an isolated test database |

---

## 6. System Architecture

The application adopts a clean Three-Tier Model-View-Controller (MVC) / REST API architecture:

```
[ Client Browser ]
        │  ▲
        │  │  HTTP Requests (Static HTML/CSS/JS + JSON Fetch APIs)
        ▼  │
┌────────────────────────────────────────────────────────┐
│ Express.js Web Server (server.js)                      │
│                                                        │
│  ├── Middleware Pipeline:                              │
│  │     ├── express.json() & express.urlencoded()       │
│  │     ├── express-session (with connect-mongo store)  │
│  │     ├── express.static('public')                    │
│  │     └── requireAuth (middleware/auth.js)            │
│  │                                                     │
│  ├── REST API Route Controllers:                       │
│  │     ├── /api/auth      -> authRoutes.js             │
│  │     ├── /api/journal   -> journalRoutes.js          │
│  │     ├── /api/dashboard -> dashboardRoutes.js        │
│  │     └── /api/profile   -> profileRoutes.js          │
│  │                                                     │
│  └── Global Error & 404 Handler                        │
└───────────────────────┬────────────────────────────────┘
                        │  ▲
                        │  │  Mongoose ODM Queries & Aggregations
                        ▼  │
┌────────────────────────────────────────────────────────┐
│ MongoDB Database (Local or Atlas Cluster)              │
│                                                        │
│  ├── Collections:                                      │
│  │     ├── 'users'        (User Schema)                │
│  │     ├── 'journalentries' (JournalEntry Schema)      │
│  │     └── 'sessions'     (connect-mongo Store)        │
└────────────────────────────────────────────────────────┘
```

---

## 7. Database Schemas

### 7.1 User Model (`models/User.js`)

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `name` | `String` | Required, trim, min: 2, max: 50 | User's full display name |
| `email` | `String` | Required, unique, lowercase, regex validated | Account login identifier |
| `password` | `String` | Required, min: 6 chars, hashed via bcrypt | Salted cryptographic password hash |
| `bio` | `String` | Max: 250 chars, default: `""` | User's personal description or motto |
| `createdAt` | `Date` | Default: `Date.now` | Account creation timestamp |
| `updatedAt` | `Date` | Default: `Date.now` | Last profile update timestamp |

**Hooks & Methods:**
- `pre('save')`: Automatically salts and hashes the password if modified.
- `methods.comparePassword(candidate)`: Compares plaintext input with hashed password via `bcrypt.compare`.
- `methods.toJSON()`: Strips the `password` field from serialized JSON output to prevent accidental exposure.

---

### 7.2 JournalEntry Model (`models/JournalEntry.js`)

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user` | `ObjectId` | Ref: `'User'`, Required, Indexed | Foreign key link to the author |
| `title` | `String` | Required, trim, min: 1, max: 120 | Entry heading |
| `content` | `String` | Required, trim, min: 1 | Body text of reflection |
| `date` | `Date` | Required, default: `Date.now`, Indexed | Chronological date of the entry |
| `mood` | `String` | Required, Enum: `['Happy', 'Calm', 'Excited', 'Sad', 'Stressed', 'Grateful']` | Emotional tag |
| `tags` | `[String]` | Array of lowercase strings | Categorization tags |
| `isFavorite` | `Boolean` | Default: `false`, Indexed | Favorite star status |
| `wordCount` | `Number` | Default: `0` | Calculated word count |
| `createdAt` | `Date` | Automatic timestamp | System creation timestamp |
| `updatedAt` | `Date` | Automatic timestamp | System last modified timestamp |

**Indexes & Optimization:**
- `{ user: 1, date: -1 }`: Optimizes user timeline sorting and date range queries.
- `{ user: 1, mood: 1 }`: Optimizes mood filtering and aggregation queries.
- `{ user: 1, isFavorite: 1 }`: Optimizes starred entries queries.

---

## 8. REST API Documentation

### 8.1 Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Body Parameters | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | `{ name, email, password }` | Registers user, validates inputs, establishes session. |
| `POST` | `/api/auth/login` | Public (Rate-Limited) | `{ email, password }` | Authenticates credentials, sets session cookie. |
| `POST` | `/api/auth/logout` | Authenticated | None | Destroys session, clears `journal.sid` cookie. |
| `GET` | `/api/auth/me` | Authenticated | None | Returns current session profile. |

### 8.2 Journal Entry Endpoints (`/api/journal`)

| Method | Endpoint | Access | Query / Body Parameters | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/journal` | Authenticated | `?search=&mood=&favorite=&startDate=&endDate=&sort=&page=&limit=` | Lists entries with search, filter, and pagination. |
| `GET` | `/api/journal/calendar` | Authenticated | `?year=YYYY&month=M` | Lightweight list of entries for monthly calendar grid. |
| `POST` | `/api/journal` | Authenticated | `{ title, content, date, mood, tags, isFavorite }` | Creates a new entry for the logged-in user. |
| `GET` | `/api/journal/:id` | Authenticated | None | Retrieves single entry (strictly checked for ownership). |
| `PUT` | `/api/journal/:id` | Authenticated | `{ title, content, date, mood, tags, isFavorite }` | Updates existing entry owned by the user. |
| `DELETE` | `/api/journal/:id` | Authenticated | None | Deletes entry owned by user. |
| `PATCH` | `/api/journal/:id/favorite` | Authenticated | None | Toggles favorite status for an entry. |

### 8.3 Dashboard Endpoints (`/api/dashboard`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Authenticated | Computes total entries, entries written today, favorites count, total word count, dominant mood, and mood breakdown percentages. |

### 8.4 Profile Endpoints (`/api/profile`)

| Method | Endpoint | Access | Body Parameters | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/profile` | Authenticated | None | Fetches profile, bio, and lifetime entry count. |
| `PUT` | `/api/profile` | Authenticated | `{ name, bio, currentPassword, newPassword }` | Updates profile fields and optional password change. |

---

## 9. Installation and Setup Instructions

### 9.1 Prerequisites
- **Node.js** (v18.x or later installed; verified on v24.22.1).
- **npm** (v9.x or later installed; verified on v11.19.1).
- **MongoDB** (Local MongoDB Community Server running on `mongodb://127.0.0.1:27017` OR a free MongoDB Atlas cluster connection string).

### 9.2 Step-by-Step Installation

1. **Clone or Open the Project Directory:**
   ```bash
   cd "digital-journal"
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *On Windows PowerShell:*
   ```powershell
   Copy-Item .env.example .env
   ```

   Verify `.env` values:
   ```ini
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/digital_journal
   SESSION_SECRET=digital_journal_secure_session_secret_ia3_key_2026
   ```

4. **MongoDB Setup:**
   - **Local MongoDB (Recommended for offline evaluation):**
     Ensure your local MongoDB service is started:
     ```powershell
     Start-Service -Name MongoDB
     ```
   - **MongoDB Atlas (Cloud Alternative):**
     Create a free M0 cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas), create a database user, allow your IP address (or `0.0.0.0/0`), and set:
     ```ini
     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/digital_journal?retryWrites=true&w=majority
     ```

5. **Run the Application:**
   ```bash
   npm start
   ```
   Or for auto-reloading during development:
   ```bash
   npm run dev
   ```

6. **Open in Browser:**
   Navigate to:
   ```
   http://localhost:3000
   ```

---

## 10. Automated Testing Procedure & Actual Results

### 10.1 Running the Test Suite
The project uses the native Node.js test runner (`node --test`) along with `supertest` to run integration tests against an isolated test database (`digital_journal_test`).

Run all tests with:
```bash
npm test
```

### 10.2 Actual Test Execution Output

```
> digital-journal@1.0.0 test
> node --test --test-concurrency=1 tests/auth.test.js tests/journal.test.js tests/dashboard.test.js

[Database] MongoDB connected successfully to: mongodb://127.0.0.1:27017/digital_journal_test
▶ Authentication & Security API Suite
  ✔ POST /api/auth/register should fail when required fields are invalid or missing (44.37ms)
  ✔ POST /api/auth/register should successfully create a new user and assign session (91.41ms)
  ✔ POST /api/auth/register should reject duplicate email registration with 409 Conflict (7.78ms)
  ✔ POST /api/auth/login should fail with invalid credentials (80.09ms)
  ✔ POST /api/auth/login should succeed with valid credentials and establish session (96.05ms)
  ✔ Unauthorized requests to protected endpoints should be rejected with 401 (9.59ms)
✔ Authentication & Security API Suite (362.48ms)

[Database] MongoDB connected successfully to: mongodb://127.0.0.1:27017/digital_journal_test
▶ Dashboard Dynamic Statistics Suite
  ✔ GET /api/dashboard/stats returns dynamic database counts and mood breakdown (26.24ms)
✔ Dashboard Dynamic Statistics Suite (218.55ms)

[Database] MongoDB connected successfully to: mongodb://127.0.0.1:27017/digital_journal_test
▶ Journal Entry CRUD & Ownership Authorization Suite
  ✔ POST /api/journal should reject blank title or content (20.69ms)
  ✔ POST /api/journal should successfully create entry with tags, mood, and favorite (13.48ms)
  ✔ GET /api/journal should retrieve user entries and calculate word count (26.23ms)
  ✔ GET /api/journal?search=... should filter entries by keyword in title/content (13.02ms)
  ✔ GET /api/journal?mood=... should filter entries by mood (11.39ms)
  ✔ GET /api/journal/:id should return full entry for owner (9.15ms)
  ✔ PUT /api/journal/:id should update an existing entry (11.99ms)
  ✔ SECURITY: User B should NOT be able to view, update, or delete User A entry (27.49ms)
  ✔ DELETE /api/journal/:id should delete entry when requested by owner (17.14ms)
✔ Journal Entry CRUD & Ownership Authorization Suite (386.40ms)

ℹ tests 16
ℹ suites 3
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2591.31
```

**Result: 16 passing tests, 0 failures, 100% test pass rate.**

---

## 11. Viva Voce & IA3 Presentation Guide

Use this section to confidently explain your technical choices to your professor or examiner:

### Q1: How do the Frontend, Backend, and Database interact?
> **Answer:** The frontend consists of clean HTML5 pages with Bootstrap 5 and vanilla JavaScript. When a user performs an action (such as saving an entry), the client-side JavaScript sends an asynchronous `fetch()` request containing JSON data and session cookies to Express REST API endpoints. The Express router routes the request through the `requireAuth` authentication middleware, which verifies `req.session.userId`. The route controller invokes Mongoose models (`User` or `JournalEntry`), which execute validated queries and aggregations against MongoDB. The result is returned as a structured JSON response, and client-side JavaScript dynamically updates the DOM.

### Q2: Why use Express Sessions with `connect-mongo` instead of plain JWTs or localStorage?
> **Answer:** 
> 1. **Revocability:** With session-based authentication stored in MongoDB (`connect-mongo`), a user's session can be immediately invalidated on logout or password change by destroying the session in the database. JWTs, unless paired with a blacklist database, cannot easily be revoked before expiry.
> 2. **XSS Protection:** Storing tokens in browser `localStorage` leaves them vulnerable to Cross-Site Scripting (XSS) extraction. Our session identifier is stored inside an `httpOnly`, `sameSite: 'lax'` cookie, meaning JavaScript cannot access the raw cookie, preventing session theft.

### Q3: How is data isolated so User A cannot access User B's entries?
> **Answer:** Every journal entry document stored in MongoDB contains a `user` foreign key pointing to the author's `_id`. In `routes/journalRoutes.js`, all find queries automatically include `{ user: req.user._id }`. Furthermore, for single-entry operations (`GET`, `PUT`, `DELETE /api/journal/:id`), the controller explicitly verifies:
> ```js
> if (entry.user.toString() !== req.user._id.toString()) {
>   return res.status(403).json({ success: false, message: 'Access forbidden' });
> }
> ```
> This authorization rule is verified by automated integration test `SECURITY: User B should NOT be able to view, update, or delete User A entry`.

### Q4: How does MongoDB calculate dynamic dashboard statistics?
> **Answer:** Rather than hardcoding numbers or loading all documents into memory, we use MongoDB aggregation pipelines and counting methods:
> - `JournalEntry.countDocuments({ user: userId })` for total reflections.
> - `JournalEntry.countDocuments({ user: userId, date: { $gte: startOfToday, $lte: endOfToday } })` for today's entries.
> - `JournalEntry.aggregate([{ $match: { user: userId } }, { $group: { _id: '$mood', count: { $sum: 1 } } }])` to group entries by mood and compute exact percentage distributions.

---

## 12. Limitations & Future Enhancements

### Current Limitations:
1. **Plain Text / Formatted Content:** The text editor currently supports multiline clean text rather than complex rich-text WYSIWYG or markdown rendering.
2. **Offline-First Sync:** The application requires network connectivity to communicate with the Node/MongoDB server.

### Future Enhancements:
1. **End-to-End Encryption (E2EE):** Client-side AES-256 encryption using a passphrase derived via PBKDF2 before transmitting content to the server.
2. **Data Export & Backup:** One-click export to PDF, JSON, or Markdown formats.
3. **Sentiment Analysis:** Integration with a lightweight NLP sentiment scoring model to automatically suggest moods from entry content.
4. **PWA (Progressive Web App):** Service Worker caching to enable offline drafting with background synchronization when reconnected.

---

## 13. License & Authorship

Developed by student for individual evaluation in **Web Technology IA3**. Released under the ISC License.
