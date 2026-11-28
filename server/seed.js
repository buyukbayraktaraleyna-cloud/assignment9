import mongoose from "mongoose";
import Author from "./models/Author.js";
import Book from "./models/Book.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/readinglist";

const authorsData = [
  { name: "Frank Herbert", born: 1920 },
  { name: "George Orwell", born: 1903 },
  { name: "Stephen Hawking", born: 1942 },
  { name: "Yuval Noah Harari", born: 1976 },
  { name: "J.R.R. Tolkien", born: 1892 },
  { name: "Harper Lee", born: 1926 },
];

// Books refer to their author by name here; the name is replaced by the
// real ObjectId after the authors have been inserted
const booksData = [
  {
    title: "Dune",
    author: "Frank Herbert",
    year: 1965,
    genre: "fantasy",
    read: true,
    rating: 5,
    tags: ["classic", "space"],
  },
  {
    title: "Children of Dune",
    author: "Frank Herbert",
    year: 1976,
    genre: "fantasy",
  },
  {
    title: "1984",
    author: "George Orwell",
    year: 1949,
    genre: "fiction",
    read: true,
    rating: 5,
    tags: ["dystopia", "classic"],
  },
  {
    title: "Animal Farm",
    author: "George Orwell",
    year: 1945,
    genre: "fiction",
    read: true,
    rating: 4,
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    year: 1988,
    genre: "science",
    read: true,
    rating: 4,
    tags: ["physics", "cosmology"],
  },
  {
    title: "The Universe in a Nutshell",
    author: "Stephen Hawking",
    year: 2001,
    genre: "science",
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    year: 2011,
    genre: "history",
    tags: ["humanity", "evolution"],
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    year: 1937,
    genre: "fantasy",
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    year: 1960,
    genre: "fiction",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

    // Make sure the unique indexes exist before inserting
    await Promise.all([Author.init(), Book.init()]);

    // Empty both collections so the script is safe to run repeatedly
    await Book.deleteMany({});
    await Author.deleteMany({});

    // insertMany runs the schema validators for every document
    const authors = await Author.insertMany(authorsData);

    // Map each author name to its generated ObjectId
    const idByName = new Map(authors.map((author) => [author.name, author._id]));

    const books = await Book.insertMany(
      booksData.map((book) => ({ ...book, author: idByName.get(book.author) }))
    );

    console.log(`Seeded ${authors.length} authors and ${books.length} books`);
  } catch (err) {
    console.error(`Seeding failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    // Always close the connection so the script can finish
    await mongoose.disconnect();
  }
}

seed();