# Reading List — Full-Stack REST API & React Application

**Student:** Aleyna Büyükbayraktar  
**Student ID:** 230408058  
**Course:** Web Programming (Assignment 9)

A full-stack personal reading list manager built with a **Node.js / Express 5 REST API** backend (`server/`) and a **React + Vite Single-Page Application** frontend (`client/`). Users can view library statistics, search, filter, sort, create, fully replace (`PUT`), partially update (`PATCH`), and delete (`DELETE`) books with live state synchronization and validation.

---

## Project Structure

```text
assignment9/
├── client/                     # React + Vite frontend SPA
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── api/
│   │   │   └── books.js        # Centralized fetch wrapper and API functions
│   │   ├── components/
│   │   │   ├── BookForm.jsx    # Create (POST) and edit (PUT) book form
│   │   │   ├── BookList.jsx    # Interactive book list (PATCH read/rating, Edit, DELETE)
│   │   │   ├── Controls.jsx    # Search, genre/status filters, and sorting controls
│   │   │   └── Stats.jsx       # Live reading statistics overview
│   │   ├── App.jsx             # Main application state, AbortController fetching, CRUD handlers
│   │   └── main.jsx            # React entry point
│   ├── .env.example            # Environment variable template (VITE_API_URL)
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── README.md
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
├── server/                     # Express 5 REST API backend
│   ├── booksStore.js           # In-memory async book store with initial seed data
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js               # Express 5 app setup, CORS, routes, and centralized error handling
│   └── validate.js             # Input, query, and business-rule validation helpers
├── .gitignore
└── README.md