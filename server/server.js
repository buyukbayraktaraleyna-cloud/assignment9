import express from "express";
import cors from "cors";
import mongoose from "mongoose";
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
import Author from "./models/Author.js";
import Book from "./models/Book.js";

const app = express();

// Read port and allowed client origin from environment variables with fallbacks
const PORT = Number(process.env.PORT) || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/readinglist";
  
// Restrict CORS strictly to the configured single client origin
app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);

// Parse incoming JSON bodies before route handlers
app.use(express.json());

// Check that an id is a real 24-character hex ObjectId
// (isValidObjectId would also accept any 12-character string)
function isValidId(id) {
  return mongoose.isObjectIdOrHexString(id);
}

// Translate database errors into HTTP responses in one place.
// Anything unknown is passed on to the error middleware as a real 500.
function handleDbError(err, res, next) {
  if (err instanceof mongoose.Error.ValidationError) {
    // One message per failing field
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: "Validation failed", details });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Invalid value for ${err.path}` });
  }

  // Duplicate key error raised by a unique index
  if (err.code === 11000) {
    const message = err.keyPattern?.name
      ? "An author with this name already exists"
      : "A book with the same title and author already exists";
    return res.status(409).json({ error: message });
  }

  return next(err);
}

// The fields a client may send for a book; everything else is ignored
const BOOK_FIELDS = ["title", "author", "year", "genre", "read", "rating", "tags"];

// Copy only the known book fields that were actually sent
function pickBookFields(body) {
  const source = body ?? {};
  const picked = {};
  for (const field of BOOK_FIELDS) {
    if (source[field] !== undefined) {
      picked[field] = source[field];
    }
  }
  return picked;
}

// Return an error message when "author" is not the id of an existing author
async function checkAuthor(authorId) {
  // A missing author is reported by the schema's "required" rule
  if (authorId === undefined) return null;
  if (!isValidId(authorId)) return "Author must be a valid author id";
  const exists = await Author.exists({ _id: authorId });
  return exists ? null : "Author does not exist";
}

// GET /api/authors — all authors sorted by name
app.get("/api/authors", async (req, res, next) => {
  try {
    const authors = await Author.find().sort({ name: 1 });
    return res.status(200).json(authors);
  } catch (err) {
    return handleDbError(err, res, next);
  }
});

// GET /api/authors/:id — one author
app.get("/api/authors/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid author id" });
    }

    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }

    return res.status(200).json(author);
  } catch (err) {
    return handleDbError(err, res, next);
  }
});

// POST /api/authors — create an author (the unique index gives the 409)
app.post("/api/authors", async (req, res, next) => {
  try {
    // Pick only the known fields; an id in the body is ignored
    const { name, born } = req.body ?? {};
    const author = await Author.create({ name, born });

    return res
      .status(201)
      .location(`/api/authors/${author.id}`)
      .json(author);
  } catch (err) {
    return handleDbError(err, res, next);
  }
});

// PATCH /api/authors/:id — change only the fields that were sent
app.patch("/api/authors/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid author id" });
    }

    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }

    const body = req.body ?? {};
    if (body.name !== undefined) author.name = body.name;
    if (body.born !== undefined) author.born = body.born;

    // save() runs all schema validators on the whole document
    await author.save();
    return res.status(200).json(author);
  } catch (err) {
    return handleDbError(err, res, next);
  }
});

// DELETE /api/authors/:id — only an author who has no books
app.delete("/api/authors/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid author id" });
    }

    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }

    // MongoDB does not protect references, so we check it ourselves
    const hasBooks = await Book.exists({ author: author._id });
    if (hasBooks) {
      return res
        .status(409)
        .json({ error: "Cannot delete an author who still has books" });
    }

    await author.deleteOne();
    return res.status(204).end();
  } catch (err) {
    return handleDbError(err, res, next);
  }
});

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

// GET /api/books/:id — one book with its author populated
app.get("/api/books/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid book id" });
    }

    // populate replaces the author ObjectId with { id, name }
    const book = await Book.findById(req.params.id).populate("author", "name");
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    return res.status(200).json(book);
  } catch (err) {
    return handleDbError(err, res, next);
  }
});

// POST /api/books — create a book; a duplicate is rejected by the unique index
app.post("/api/books", async (req, res, next) => {
  try {
    const data = pickBookFields(req.body);

    const authorError = await checkAuthor(data.author);
    if (authorError) {
      return res.status(400).json({ error: authorError });
    }

    const book = await Book.create(data);
    await book.populate("author", "name");

    return res
      .status(201)
      .location(`/api/books/${book.id}`)
      .json(book);
  } catch (err) {
    return handleDbError(err, res, next);
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
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid book id" });
    }

    const deleted = await Book.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Book not found" });
    }

    return res.status(204).end();
  } catch (err) {
    return handleDbError(err, res, next);
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

// Connect to MongoDB first; only start listening once the connection works
async function start() {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Fail fast instead of waiting 30 seconds when the database is down
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB");
    // Make sure all indexes (e.g. unique ones) exist before accepting requests
    await Promise.all([Author.init(), Book.init()]);
  } catch (err) {
    // Do not print the connection string: it may contain a password
    console.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();