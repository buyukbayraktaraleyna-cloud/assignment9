// Initial seed data: at least 6 books, covering 4 genres, with rated books included
const initialBooks = [
  {
    id: 1,
    title: "Dune",
    author: "Frank Herbert",
    year: 1965,
    genre: "fantasy",
    read: true,
    rating: 5,
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    year: 1949,
    genre: "fiction",
    read: true,
    rating: 5,
  },
  {
    id: 3,
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    year: 1988,
    genre: "science",
    read: true,
    rating: 4,
  },
  {
    id: 4,
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    year: 2011,
    genre: "history",
    read: false,
    rating: null,
  },
  {
    id: 5,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    year: 1937,
    genre: "fantasy",
    read: false,
    rating: null,
  },
  {
    id: 6,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    year: 1960,
    genre: "fiction",
    read: false,
    rating: null,
  },
];

// In-memory store state (reassigned immutably on every change)
let books = initialBooks.map((book) => ({ ...book }));
let nextId = 7;

// Helper to simulate an asynchronous data source with a short delay
function simulateLatency(ms = 20) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Return shallow copies of all stored books to prevent external mutation
export async function getAllBooks() {
  await simulateLatency();
  return books.map((book) => ({ ...book }));
}

// Find a single book by its integer ID
export async function getBookById(id) {
  await simulateLatency();
  const found = books.find((book) => book.id === id);
  return found ? { ...found } : null;
}

// Check case-insensitively if another book already has the same title and author
export async function hasDuplicateBook(title, author, excludeId = null) {
  await simulateLatency();
  const normalizedTitle = title.toLowerCase();
  const normalizedAuthor = author.toLowerCase();

  return books.some(
    (book) =>
      book.id !== excludeId &&
      book.title.toLowerCase() === normalizedTitle &&
      book.author.toLowerCase() === normalizedAuthor
  );
}

// Immutably add a new book with a server-assigned ID
export async function createBook(bookData) {
  await simulateLatency();
  const newBook = {
    id: nextId++,
    title: bookData.title,
    author: bookData.author,
    year: bookData.year,
    genre: bookData.genre,
    read: bookData.read,
    rating: bookData.rating,
  };

  books = [...books, newBook];
  return { ...newBook };
}

// Immutably replace an existing book by ID
export async function replaceBook(id, bookData) {
  await simulateLatency();
  const exists = books.some((book) => book.id === id);
  if (!exists) {
    return null;
  }

  const replacedBook = {
    id,
    title: bookData.title,
    author: bookData.author,
    year: bookData.year,
    genre: bookData.genre,
    read: bookData.read,
    rating: bookData.rating,
  };

  books = books.map((book) => (book.id === id ? replacedBook : book));
  return { ...replacedBook };
}

// Immutably update selected fields of an existing book by ID
export async function updateBook(id, updatedFields) {
  await simulateLatency();
  const existing = books.find((book) => book.id === id);
  if (!existing) {
    return null;
  }

  const updatedBook = {
    ...existing,
    ...updatedFields,
    id,
  };

  books = books.map((book) => (book.id === id ? updatedBook : book));
  return { ...updatedBook };
}

// Immutably remove a book by ID
export async function deleteBook(id) {
  await simulateLatency();
  const initialLength = books.length;
  books = books.filter((book) => book.id !== id);
  return books.length < initialLength;
}