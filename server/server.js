import express from "express";
import cors from "cors";
import {
  createBook,
  deleteBook,
  getAllBooks,
  getBookById,
  hasDuplicateBook,
  replaceBook,
  updateBook,
} from "./booksStore.js";
import {
  validateBooksQuery,
  validateCompleteBook,
  validateIdParam,
  validatePatchBook,
} from "./validate.js";

const app = express();

// Read port and allowed client origin from environment variables with fallbacks
const PORT = Number(process.env.PORT) || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Restrict CORS strictly to the configured single client origin
app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);

// Parse incoming JSON bodies before route handlers
app.use(express.json());

// GET /api/books — list books with filtering, sorting, and pagination
app.get("/api/books", async (req, res, next) => {
  try {
    const queryCheck = validateBooksQuery(req.query);
    if (!queryCheck.valid) {
      return res.status(400).json({ error: queryCheck.error });
    }

    const { genre, read, q, sort, order, limit, page } = queryCheck.value;
    const allBooks = await getAllBooks();

    // Apply genre, read status, and case-insensitive title/author search filters
    const filtered = allBooks.filter((book) => {
      if (genre !== undefined && book.genre !== genre) {
        return false;
      }
      if (read !== undefined && book.read !== read) {
        return false;
      }
      if (q !== undefined && q.length > 0) {
        const needle = q.toLowerCase();
        const matchesTitle = book.title.toLowerCase().includes(needle);
        const matchesAuthor = book.author.toLowerCase().includes(needle);
        if (!matchesTitle && !matchesAuthor) {
          return false;
        }
      }
      return true;
    });

    // Sort a shallow copy without mutating stored data
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "rating") {
        // Books without a rating always sort last regardless of sort order
        if (a.rating === null && b.rating === null) return 0;
        if (a.rating === null) return 1;
        if (b.rating === null) return -1;
        const diff = a.rating - b.rating;
        return order === "asc" ? diff : -diff;
      }

      if (sort === "title" || sort === "author") {
        const cmp = a[sort].localeCompare(b[sort], undefined, {
          sensitivity: "base",
        });
        return order === "asc" ? cmp : -cmp;
      }

      // Numeric comparison for 'year' or default 'id'
      const diff = a[sort] - b[sort];
      return order === "asc" ? diff : -diff;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginated = sorted.slice(startIndex, startIndex + limit);

    return res.status(200).json(paginated);
  } catch (err) {
    return next(err);
  }
});

// GET /api/stats — compute statistics dynamically from current books
app.get("/api/stats", async (req, res, next) => {
  try {
    const allBooks = await getAllBooks();
    const total = allBooks.length;
    const read = allBooks.filter((book) => book.read).length;
    const unread = total - read;

    const ratedBooks = allBooks.filter((book) => book.rating !== null);
    const averageRating =
      ratedBooks.length === 0
        ? null
        : Number(
            (
              ratedBooks.reduce((sum, book) => sum + book.rating, 0) /
              ratedBooks.length
            ).toFixed(2)
          );

    // Count books per genre, including only genres with at least one book
    const byGenre = {};
    for (const book of allBooks) {
      byGenre[book.genre] = (byGenre[book.genre] || 0) + 1;
    }

    return res.status(200).json({
      total,
      read,
      unread,
      averageRating,
      byGenre,
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/crash — deliberate async error route to verify 500 error middleware
app.get("/api/crash", async (req, res, next) => {
  try {
    throw new Error("Intentional crash to test async error handling");
  } catch (err) {
    return next(err);
  }
});

// GET /api/books/:id — fetch a single book by positive integer ID
app.get("/api/books/:id", async (req, res, next) => {
  try {
    const idCheck = validateIdParam(req.params.id);
    if (!idCheck.valid) {
      return res.status(400).json({ error: idCheck.error });
    }

    const book = await getBookById(idCheck.value);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    return res.status(200).json(book);
  } catch (err) {
    return next(err);
  }
});

// POST /api/books — create a new book and return 201 with Location header
app.post("/api/books", async (req, res, next) => {
  try {
    const bodyCheck = validateCompleteBook(req.body);
    if (!bodyCheck.valid) {
      return res.status(400).json({ error: bodyCheck.error });
    }

    const duplicate = await hasDuplicateBook(
      bodyCheck.data.title,
      bodyCheck.data.author
    );
    if (duplicate) {
      return res.status(409).json({
        error: "A book with the same title and author already exists",
      });
    }

    const createdBook = await createBook(bodyCheck.data);
    return res
      .status(201)
      .location(`/api/books/${createdBook.id}`)
      .json(createdBook);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/books/:id — replace an existing book with a complete validated body
app.put("/api/books/:id", async (req, res, next) => {
  try {
    const idCheck = validateIdParam(req.params.id);
    if (!idCheck.valid) {
      return res.status(400).json({ error: idCheck.error });
    }

    const existingBook = await getBookById(idCheck.value);
    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    const bodyCheck = validateCompleteBook(req.body);
    if (!bodyCheck.valid) {
      return res.status(400).json({ error: bodyCheck.error });
    }

    const duplicate = await hasDuplicateBook(
      bodyCheck.data.title,
      bodyCheck.data.author,
      idCheck.value
    );
    if (duplicate) {
      return res.status(409).json({
        error: "A book with the same title and author already exists",
      });
    }

    const replacedBook = await replaceBook(idCheck.value, bodyCheck.data);
    return res.status(200).json(replacedBook);
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/books/:id — partially update an existing book
app.patch("/api/books/:id", async (req, res, next) => {
  try {
    const idCheck = validateIdParam(req.params.id);
    if (!idCheck.valid) {
      return res.status(400).json({ error: idCheck.error });
    }

    const existingBook = await getBookById(idCheck.value);
    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    const bodyCheck = validatePatchBook(req.body, existingBook);
    if (!bodyCheck.valid) {
      return res.status(400).json({ error: bodyCheck.error });
    }

    const duplicate = await hasDuplicateBook(
      bodyCheck.data.title,
      bodyCheck.data.author,
      idCheck.value
    );
    if (duplicate) {
      return res.status(409).json({
        error: "A book with the same title and author already exists",
      });
    }

    const updatedBook = await updateBook(idCheck.value, bodyCheck.data);
    return res.status(200).json(updatedBook);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/books/:id — delete a book and return 204 with no body
app.delete("/api/books/:id", async (req, res, next) => {
  try {
    const idCheck = validateIdParam(req.params.id);
    if (!idCheck.valid) {
      return res.status(400).json({ error: idCheck.error });
    }

    const deleted = await deleteBook(idCheck.value);
    if (!deleted) {
      return res.status(404).json({ error: "Book not found" });
    }

    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

// 404 fallback for any unmatched route under /api (avoids Express 4 wildcard)
app.use("/api", (req, res) => {
  return res.status(404).json({ error: "Not found" });
});

// Global error-handling middleware for malformed JSON (400) and server errors (500)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Malformed JSON in request body" });
  }

  console.error(err);
  return res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});