# Reading List — Full-Stack REST API & React Application

**Student:** Aleyna Büyükbayraktar
**Student ID:** 230408058
**Course:** Web Programming (Assignment 9)

A full-stack reading list application built with a **Node.js / Express 5 REST API** backend (`server/`) and a **React + Vite** frontend (`client/`). Users can view live library statistics, search by title or author, filter by genre and reading status, sort books, add new books (`POST`), fully edit existing books (`PUT`), toggle read status or rating inline (`PATCH`), and delete books (`DELETE`).

Books are stored **in memory** on the server (no database, no login), so the data returns to its initial seed every time the server restarts.

---

## 1. Installation & Running

The server and the client run at the same time in **two separate terminals**.

### Server (`server/` — port `3000`)

```bash
cd server
npm install
npm run dev      # development mode (node --watch, restarts on file changes)
# or
npm start        # normal mode (node server.js)
```

### Client (`client/` — port `5173`)

```bash
cd client
npm install
copy .env.example .env     # Windows cmd   (macOS/Linux/Git Bash: cp .env.example .env)
npm run dev
```

Then open **http://localhost:5173** in the browser.

### Environment Variables

| Variable | Where | Default | Meaning |
|---|---|---|---|
| `PORT` | server | `3000` | Port the API listens on |
| `CLIENT_ORIGIN` | server | `http://localhost:5173` | The **single** origin allowed by CORS |
| `VITE_API_URL` | `client/.env` | `http://localhost:3000` | Base URL used by `src/api/books.js` |

The server reads `PORT` and `CLIENT_ORIGIN` from `process.env` (it does **not** load a `.env` file). They are optional; to override them, set them in the terminal before starting the server:

```bash
# Windows cmd
set PORT=4000
set CLIENT_ORIGIN=http://localhost:5173
npm start

# Git Bash / macOS / Linux
PORT=4000 CLIENT_ORIGIN=http://localhost:5173 npm start
```

If the server port changes, `VITE_API_URL` in `client/.env` must be changed too (and the Vite dev server restarted). The client uses **no Vite proxy**: the server sends the CORS headers itself with the `cors` package.

---

## 2. File Organization

```text
assignment9/
├── client/                     # React + Vite frontend
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── api/
│   │   │   └── books.js        # The only place that calls fetch (shared request helper + API functions)
│   │   ├── components/
│   │   │   ├── BookForm.jsx    # Create (POST) and edit (PUT) form
│   │   │   ├── BookList.jsx    # Book list with read toggle / rating (PATCH), Edit and Delete
│   │   │   ├── Controls.jsx    # Search, genre filter, read filter, sort field and direction
│   │   │   └── Stats.jsx       # Statistics panel (GET /api/stats)
│   │   ├── App.jsx             # Application state, AbortController, CRUD handlers
│   │   └── main.jsx            # React entry point
│   ├── .env.example            # Documents VITE_API_URL
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── README.md
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
├── server/                     # Express 5 REST API
│   ├── booksStore.js           # In-memory data + async access functions (immutable updates, seed data)
│   ├── package-lock.json
│   ├── package.json            # "type": "module", start / dev scripts
│   ├── server.js               # CORS, express.json(), routes, 404 fallback, error middleware
│   └── validate.js             # Hand-written validation for id, book body and query options
├── .gitignore                  # node_modules and .env files are never committed
└── README.md
```

---

## 3. API Overview

| Method and path | Behaviour | Success | Errors |
|---|---|---|---|
| `GET /api/books` | List with query options (`genre`, `read`, `q`, `sort`, `order`, `limit`, `page`) | 200 | 400 |
| `GET /api/books/:id` | One book | 200 | 400, 404 |
| `POST /api/books` | Create a book from a complete body | 201 + `Location` | 400, 409 |
| `PUT /api/books/:id` | Replace a book with a complete body | 200 | 400, 404, 409 |
| `PATCH /api/books/:id` | Change only the fields sent | 200 | 400, 404, 409 |
| `DELETE /api/books/:id` | Delete a book | 204 (no body) | 400, 404 |
| `GET /api/stats` | Statistics computed from the current data on every request | 200 | — |

All error responses have the shape `{ "error": "message" }`.

### Test route: `GET /api/crash`

This route is **intentionally kept** in `server.js`. Its async handler deliberately throws an error to prove that the error-handling middleware works: the server logs the error in the terminal and the client receives `500` with `{ "error": "Something went wrong" }`, without any stack trace.

---

## 4. Testing Evidence (`curl --include`)

All requests below were run in **Windows cmd** against a freshly started server (`npm start`). Inside cmd, JSON bodies are written with escaped double quotes (`\"`).

### 4.1 `GET /api/stats` — before any change → `200`

```text
> curl --include http://localhost:3000/api/stats

HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 112
ETag: W/"70-CbsCrOrfWPIxoL2t0fdddelG/Ng"
Date: Sun, 22 Nov 2026 10:44:12 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"total":6,"read":3,"unread":3,"averageRating":4.67,"byGenre":{"fantasy":2,"fiction":2,"science":1,"history":1}}
```

### 4.2 List with three query parameters → `200`

```text
> curl --include "http://localhost:3000/api/books?genre=fiction&sort=year&order=desc"

HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 223
ETag: W/"df-MnALzvpDsBPoJrI9nH72/PfmAVE"
Date: Sun, 22 Nov 2026 10:44:12 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":6,"title":"To Kill a Mockingbird","author":"Harper Lee","year":1960,"genre":"fiction","read":false,"rating":null},{"id":2,"title":"1984","author":"George Orwell","year":1949,"genre":"fiction","read":true,"rating":5}]
```

Only fiction books are returned, sorted by year from newest to oldest.

### 4.3 One book → `200`

```text
> curl --include http://localhost:3000/api/books/1

HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 101
ETag: W/"65-Hyywy/gzkRCvqljDHBWAi++ZYhE"
Date: Sun, 22 Nov 2026 10:44:12 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":1,"title":"Dune","author":"Frank Herbert","year":1965,"genre":"fantasy","read":true,"rating":5}
```

### 4.4 Create a book → `201` with `Location` header

```text
> curl --include -X POST http://localhost:3000/api/books -H "Content-Type: application/json" -d "{\"title\":\"Clean Code\",\"author\":\"Robert C. Martin\",\"year\":2008,\"genre\":\"non-fiction\",\"read\":true,\"rating\":5}"

HTTP/1.1 201 Created
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Location: /api/books/8
Content-Type: application/json; charset=utf-8
Content-Length: 114
ETag: W/"72-0IFk77plfr8YaAPI1rkvPge4yV0"
Date: Sun, 22 Nov 2026 10:46:52 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":8,"title":"Clean Code","author":"Robert C. Martin","year":2008,"genre":"non-fiction","read":true,"rating":5}
```

The id is assigned by the server. It is `8` (not `7`) because a book with id `7` had been created and deleted earlier while the same server process was running: ids are never reused.

### 4.5 `GET /api/stats` — after the change → `200`

```text
> curl --include http://localhost:3000/api/stats

HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 128
ETag: W/"80-3ibwHzBQy154xPau8ffq5ZmrtmE"
Date: Sun, 22 Nov 2026 10:46:58 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"total":7,"read":4,"unread":3,"averageRating":4.75,"byGenre":{"fantasy":2,"fiction":2,"science":1,"history":1,"non-fiction":1}}
```

Compared to 4.1: `total` 6 → 7, `read` 3 → 4, `averageRating` 4.67 → 4.75, and `non-fiction` now appears in `byGenre`. The statistics are computed from the current data on every request.

### 4.6 Duplicate (case-insensitive title + author) → `409`

```text
> curl --include -X POST http://localhost:3000/api/books -H "Content-Type: application/json" -d "{\"title\":\"clean code\",\"author\":\"robert c. martin\",\"year\":2008,\"genre\":\"non-fiction\"}"

HTTP/1.1 409 Conflict
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 64
ETag: W/"40-Y8ZVtnRDFrTFCmvse+K/kdGoMVg"
Date: Sun, 22 Nov 2026 10:47:04 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"A book with the same title and author already exists"}
```

### 4.7 Invalid body → `400`

```text
> curl --include -X POST http://localhost:3000/api/books -H "Content-Type: application/json" -d "{\"title\":\"\",\"author\":\"X\",\"year\":3000,\"genre\":\"poetry\"}"

HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 69
ETag: W/"45-aduA4SqA9wur66eJUqrOhp66vfs"
Date: Sun, 22 Nov 2026 10:47:10 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Title must be between 1 and 100 characters after trimming"}
```

### 4.8 Malformed JSON → `400` (JSON, not Express's HTML page)

This happened by accident: the first time, the body was written with single quotes in Windows cmd. cmd does not treat single quotes as quotes, so the server received broken JSON.

```text
> curl --include -X POST http://localhost:3000/api/books -H "Content-Type: application/json" -d '{"title":"Clean Code","author":"Robert C. Martin","year":2008,"genre":"non-fiction","read":true,"rating":5}'

HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 42
ETag: W/"2a-Kp6r6EoQdfa9J08PVdn0M1MJ9NY"
Date: Sun, 22 Nov 2026 10:44:12 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Malformed JSON in request body"}
```

### 4.9 Repeated query parameter → `400`

```text
> curl --include "http://localhost:3000/api/books?genre=fiction&genre=history"

HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 56
ETag: W/"38-ocNrC6BvR9Rx4zJYdEBeMUuIYyc"
Date: Sun, 22 Nov 2026 10:44:12 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Query parameter 'genre' must not be repeated"}
```

### 4.10 Missing book → `404`

```text
> curl --include http://localhost:3000/api/books/999

HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 26
ETag: W/"1a-9K7Ys+5Z9m3qczPTmMk82VGBL7g"
Date: Sun, 22 Nov 2026 10:44:12 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Book not found"}
```

### 4.11 `PUT` and `PATCH` on the same book → `200`

**PUT** (body without `read` and `rating`):

```text
> curl --include -X PUT http://localhost:3000/api/books/8 -H "Content-Type: application/json" -d "{\"title\":\"Clean Code\",\"author\":\"Robert C. Martin\",\"year\":2008,\"genre\":\"other\"}"

HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 112
ETag: W/"70-Iaezhb9rpcqLwg9dtB1hmNLkGgE"
Date: Sun, 22 Nov 2026 10:48:09 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":8,"title":"Clean Code","author":"Robert C. Martin","year":2008,"genre":"other","read":false,"rating":null}
```

**PATCH** (only `read` and `rating`):

```text
> curl --include -X PATCH http://localhost:3000/api/books/8 -H "Content-Type: application/json" -d "{\"read\":true,\"rating\":4}"

HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 108
ETag: W/"6c-xGxi9SyFzkfgvb9GVvf7LsrTXx0"
Date: Sun, 22 Nov 2026 10:48:14 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":8,"title":"Clean Code","author":"Robert C. Martin","year":2008,"genre":"other","read":true,"rating":4}
```

**Difference:** `PUT` replaced the whole book. The fields that were not sent went back to their defaults (`read: true` → `false`, `rating: 5` → `null`). `PATCH` changed only `read` and `rating`, and kept every other field (`genre` stayed `"other"`).

### 4.12 `DELETE` → `204`, then the same `DELETE` again → `404`

```text
> curl --include -X DELETE http://localhost:3000/api/books/8

HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Date: Sun, 22 Nov 2026 10:48:20 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

```text
> curl --include -X DELETE http://localhost:3000/api/books/8

HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 26
ETag: W/"1a-9K7Ys+5Z9m3qczPTmMk82VGBL7g"
Date: Sun, 22 Nov 2026 10:48:25 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Book not found"}
```

The `204` response has no body and no `Content-Type`.

---

## 5. CORS Preflight Evidence

### 5.1 Browser Network tab

**Description:** With the server and the client running, I opened `http://localhost:5173`, opened DevTools (F12) → **Network**, and clicked **Mark Read** on *The Hobbit* (id `5`). The Network tab showed the request `PATCH http://localhost:3000/api/books/5` answered with **`200 OK`**, and its response headers included `Access-Control-Allow-Origin: http://localhost:5173`. Because this header matches the page's origin, the browser allowed the page to read the response, and the list and statistics were refreshed with `GET /api/books` and `GET /api/stats`.

In my Chrome version the preflight was **not listed as a separate row** in the Network tab, even after clearing the list and trying again (the "Disable cache" option was on). To see the preflight itself, I sent exactly the same `OPTIONS` request the browser sends before this `PATCH` with `curl` (5.2).

### 5.2 The preflight request (`OPTIONS`) → `204`

```text
> curl --include -X OPTIONS http://localhost:3000/api/books/5 -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: PATCH" -H "Access-Control-Request-Headers: content-type"

HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin, Access-Control-Request-Headers
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: content-type
Content-Length: 0
Date: Sun, 22 Nov 2026 11:27:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

**Why a preflight is needed:** the client (`localhost:5173`) and the server (`localhost:3000`) have different ports, so they are different origins. `PATCH` is not a "simple" method and the request carries `Content-Type: application/json`, so before sending it the browser first asks the server with an `OPTIONS` request: *"may origin `http://localhost:5173` send a `PATCH` with a `content-type` header?"*. The `cors` package answers with `204` and the `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` headers, and only then the browser sends the real `PATCH`. Simple `GET` requests (the list and the statistics) do not need a preflight.

---

## 6. Reasoning Questions

**1. Parameters — Why is `id` a route parameter while `genre` and `sort` are query parameters? What would change if `id` were in the query string?**
The `id` identifies *one specific resource*, so it belongs in the path: `/api/books/3` *is* book 3, and `GET`, `PUT`, `PATCH` and `DELETE` all act on that same URL. `genre` and `sort` do not identify a resource; they are optional options that change *how the collection is shown*, can be combined, and can be left out. If `id` were in the query string (`/api/books?id=3`), every method would hit the collection URL, the routes could not tell "one book" from "the list", a missing `id` would have to be checked by hand, and the `Location` header of a `201` could not point to a clear resource URL.

**2. Body parsing — Experiment: move `express.json()` below the routes. What happened to `req.body`, and what status did a `POST` return?**
I moved `app.use(express.json())` below all routes and sent a valid `POST /api/books` with a JSON body. `req.body` was `undefined`, because the routes ran *before* the JSON parser had a chance to read the body (middleware runs in the order it is registered). My validation rejected it, so the server answered `400` with `{"error":"Request body must be a JSON object"}` even though the body was valid JSON. After moving `express.json()` back above the routes, the same request returned `201`.

**3. One response — Experiment: remove the `return` before an early `404` response in one handler. What happened and why?**
I removed the `return` before `res.status(404).json(...)` in `GET /api/books/:id` and requested `/api/books/999`. The client still received the `404`, but the handler did not stop: it continued to `res.status(200).json(book)` and tried to send a second response. The server terminal printed `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`. Each request can only have one response, so `return` is needed to end the handler after an early response.

**4. PUT and PATCH — Using your own API, explain a situation where PATCH is the better choice and one where PUT is.**
`PATCH` is the better choice when only one or two fields change: when the user clicks **Mark Read** or chooses a rating, the client sends only `{"read": true}` or `{"rating": 4}` and the rest of the book stays the same. `PUT` is the better choice in the **Edit** form, where the user sees and submits the whole book, so the client sends the complete book and it replaces the old one. Section 4.11 shows the difference: `PUT` without `read`/`rating` reset them to their defaults, while `PATCH` changed only the fields that were sent.

**5. CORS — Experiment: set `CLIENT_ORIGIN` to a wrong value. What did the browser console show, did the server log the request, and why does `curl` still work?**
I started the server with `CLIENT_ORIGIN=http://localhost:9999` and opened the client on `http://localhost:5173`. The console showed an error like *"Access to fetch at 'http://localhost:3000/api/books' from origin 'http://localhost:5173' has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:9999' that is not equal to the supplied origin"*, and the page showed the error state. The server did **not** log any error: for the `GET` requests it actually received the request, ran the route and answered `200`, but with `Access-Control-Allow-Origin: http://localhost:9999`; the *browser* then refused to give the response to the page. `curl` still works because CORS is enforced only by browsers — `curl` does not check the `Access-Control-Allow-Origin` header at all.

**6. Validation — The client already checks the form. Why must the server validate again?**
Client-side checks only exist for a better user experience; they can be skipped completely. Anyone can send requests directly with `curl`, Postman or the DevTools console, or change the JavaScript in the browser, exactly like the invalid requests in Section 4.7 and 4.8. Some rules can only be checked on the server, such as duplicates (Section 4.6), because only the server knows all the stored books. The server is the only place that protects the data, so it must never trust the client.

**7. State — Restart the server and describe what happened to the data. What does this tell you about where the data lives, and what is needed to keep it?**
After adding and editing books, I stopped the server with `Ctrl + C` and started it again: all my changes were gone and the list returned to the 6 seed books. The data lives only in a JavaScript array in the memory of the Node.js process (`booksStore.js`), so it disappears when the process stops. To keep it, the data must be stored outside the process, in a database or at least a file.

---

## 7. Self-Study Notes

- **`URLSearchParams`** — In `client/src/api/books.js`, `getBooks()` builds the query string with `params.set(...)` and `params.toString()`. It encodes special characters automatically (for example a space or `&` in the search text), so the URL can never break. Default values (`all`, `sort=id`, `order=asc`) are not added, so the URL stays clean and passes the server's validation.
- **`localeCompare`** — In `server/server.js`, sorting by `title` or `author` uses `a.localeCompare(b, undefined, { sensitivity: "base" })`. Comparing with `<` / `>` would compare character codes, so uppercase letters would come before lowercase ones and letters like `ü` or `ç` would be sorted wrongly. `localeCompare` compares alphabetically, and `sensitivity: "base"` ignores case. Sorting is done on a copy (`[...filtered].sort(...)`) so the stored array is not changed.
- **`import.meta.env` and the `VITE_` prefix** — Vite replaces `import.meta.env.VITE_API_URL` with the value from `client/.env` when it builds the client. Only variables starting with `VITE_` are exposed, because everything in the client bundle can be read by anyone in the browser; the prefix prevents accidentally sending secrets to the browser. After changing `.env`, the Vite dev server must be restarted.
- **Empty `204` response in Express 5** — In `DELETE /api/books/:id` I use `res.status(204).end()`, which sends the status with no body. `res.status(204).json(...)` would be wrong because a `204` must not have a body. On the client, `request()` checks `response.status === 204` and returns `null` **before** calling `response.json()`, because parsing an empty body would throw an error.
- **`AbortController` and `AbortError`** — In `App.jsx`, the `useEffect` creates an `AbortController`, passes its `signal` to `fetch`, and calls `controller.abort()` in the cleanup function. When the filters change quickly, the old request is cancelled, so an old response can never overwrite a newer one. A cancelled `fetch` rejects with an error whose `name` is `"AbortError"`; the code checks this and ignores it, so no error message is shown for a request that was cancelled on purpose.

---

## 8. Challenges Faced

1. **`sort=id` rejected by the server** — At first the client sent `sort=id` for the default order, but the server only accepts `title`, `author`, `year` or `rating` and returned `400`. I fixed it by not adding default values to the query string in `api/books.js` (commit *"omit default sort=id query parameter"*).
2. **Quotes in Windows cmd** — When I ran the `curl` tests, the bodies written with single quotes reached the server as broken JSON and all `POST`/`PUT`/`PATCH` requests returned `400 Malformed JSON`. cmd does not understand single quotes, so I rewrote the bodies with escaped double quotes (`\"`). This also gave me real evidence that malformed JSON returns a JSON error (Section 4.8).
3. **Ids are never reused** — During testing my new book got id `8` instead of `7`, and requests to `/api/books/7` returned `404`. A book with id 7 had been created and deleted earlier in the same server process, and the server never reuses ids. I had to read the `Location` header instead of guessing the id.
4. **File name mismatch** — I first created `bookStore.js`, but the required structure uses `booksStore.js`, so I renamed it to match the assignment.
5. **Keeping `read` and `rating` consistent** — A rating is only allowed when `read` is `true`. In the client I disabled the rating control for unread books and send `rating: null` when a book is marked unread, so the user cannot create a state the server would reject. The server still checks this rule for every `POST`, `PUT` and `PATCH`.
