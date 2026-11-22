import { useCallback, useEffect, useState } from "react";
import {
  createBook,
  deleteBook,
  getBooks,
  getStats,
  patchBook,
  replaceBook,
} from "./api/books.js";
import BookForm from "./components/BookForm.jsx";
import BookList from "./components/BookList.jsx";
import Controls from "./components/Controls.jsx";
import Stats from "./components/Stats.jsx";

const DEFAULT_FILTERS = {
  q: "",
  genre: "all",
  read: "all",
  sort: "id",
  order: "asc",
};

function App() {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [editingBook, setEditingBook] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyBookId, setBusyBookId] = useState(null);
  const [error, setError] = useState("");

  const loadLibraryData = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");

      try {
        const [booksData, statsData] = await Promise.all([
          getBooks(filters, signal),
          getStats(signal),
        ]);
        setBooks(booksData);
        setStats(statsData);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        setError(err.message || "Failed to load reading list data.");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [filters]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadLibraryData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadLibraryData]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleFormSubmit = async (payload, bookId) => {
    setSubmitting(true);
    setError("");

    try {
      if (bookId !== null) {
        await replaceBook(bookId, payload);
        setEditingBook(null);
      } else {
        await createBook(payload);
      }
      await loadLibraryData();
      return true;
    } catch (err) {
      setError(err.message || "Failed to save book.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRead = async (book) => {
    const nextRead = !book.read;
    setBusyBookId(book.id);
    setError("");

    try {
      await patchBook(book.id, {
        read: nextRead,
        rating: nextRead ? book.rating : null,
      });
      await loadLibraryData();
    } catch (err) {
      setError(err.message || "Failed to update read status.");
    } finally {
      setBusyBookId(null);
    }
  };

  const handleChangeRating = async (bookId, nextRating) => {
    setBusyBookId(bookId);
    setError("");

    try {
      await patchBook(bookId, { rating: nextRating });
      await loadLibraryData();
    } catch (err) {
      setError(err.message || "Failed to update rating.");
    } finally {
      setBusyBookId(null);
    }
  };

  const handleDeleteBook = async (bookId) => {
    setBusyBookId(bookId);
    setError("");

    try {
      await deleteBook(bookId);
      if (editingBook?.id === bookId) {
        setEditingBook(null);
      }
      await loadLibraryData();
    } catch (err) {
      setError(err.message || "Failed to delete book.");
    } finally {
      setBusyBookId(null);
    }
  };

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem" }}>
      <header>
        <h1>Reading List</h1>
      </header>

      {error && (
        <p
          role="alert"
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            borderRadius: "6px",
          }}
        >
          {error}
        </p>
      )}

      <Stats stats={stats} loading={loading} />
      <hr />
      <BookForm
        editingBook={editingBook}
        onSubmit={handleFormSubmit}
        onCancelEdit={() => setEditingBook(null)}
        submitting={submitting}
      />
      <hr />
      <Controls
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />
      <hr />
      <BookList
        books={books}
        loading={loading}
        busyBookId={busyBookId}
        onToggleRead={handleToggleRead}
        onChangeRating={handleChangeRating}
        onEdit={(book) => setEditingBook(book)}
        onDelete={handleDeleteBook}
      />
    </main>
  );
}

export default App;