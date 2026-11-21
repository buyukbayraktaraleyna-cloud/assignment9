import { useEffect, useState } from "react";

const GENRE_OPTIONS = [
  "fiction",
  "non-fiction",
  "science",
  "history",
  "fantasy",
  "other",
];

const INITIAL_FORM = {
  title: "",
  author: "",
  year: new Date().getFullYear(),
  genre: "fiction",
  read: false,
  rating: "",
};

function BookForm({ editingBook, onSubmit, onCancelEdit, submitting }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [validationError, setValidationError] = useState("");

  // Populate form fields when switching into edit mode, or reset when exiting
  useEffect(() => {
    if (editingBook) {
      setFormData({
        title: editingBook.title,
        author: editingBook.author,
        year: editingBook.year,
        genre: editingBook.genre,
        read: editingBook.read,
        rating: editingBook.rating !== null ? String(editingBook.rating) : "",
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setValidationError("");
  }, [editingBook]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => {
      if (type === "checkbox" && name === "read") {
        return {
          ...prev,
          read: checked,
          // Clear rating automatically if the book is marked unread
          rating: checked ? prev.rating : "",
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError("");

    const trimmedTitle = formData.title.trim();
    const trimmedAuthor = formData.author.trim();
    const numericYear = Number(formData.year);
    const currentYear = new Date().getFullYear();

    if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
      setValidationError("Title must be between 1 and 100 characters.");
      return;
    }

    if (trimmedAuthor.length < 1 || trimmedAuthor.length > 100) {
      setValidationError("Author must be between 1 and 100 characters.");
      return;
    }

    if (
      !Number.isInteger(numericYear) ||
      numericYear < 1000 ||
      numericYear > currentYear
    ) {
      setValidationError(
        `Year must be a whole number between 1000 and ${currentYear}.`
      );
      return;
    }

    const payload = {
      title: trimmedTitle,
      author: trimmedAuthor,
      year: numericYear,
      genre: formData.genre,
      read: formData.read,
      rating:
        formData.read && formData.rating !== ""
          ? Number(formData.rating)
          : null,
    };

    const success = await onSubmit(payload, editingBook?.id ?? null);
    if (success && !editingBook) {
      setFormData(INITIAL_FORM);
    }
  };

  return (
    <section aria-label="Book form" className="form-panel">
      <h2>{editingBook ? `Edit Book #${editingBook.id}` : "Add a New Book"}</h2>

      {validationError && (
        <p role="alert" className="error-banner">
          {validationError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="book-form">
        <div className="form-grid">
          <label>
            Title
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              maxLength={100}
              required
              placeholder="e.g. The Left Hand of Darkness"
            />
          </label>

          <label>
            Author
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              maxLength={100}
              required
              placeholder="e.g. Ursula K. Le Guin"
            />
          </label>

          <label>
            Year
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min={1000}
              max={new Date().getFullYear()}
              required
            />
          </label>

          <label>
            Genre
            <select
              name="genre"
              value={formData.genre}
              onChange={handleChange}
            >
              {GENRE_OPTIONS.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="read"
              checked={formData.read}
              onChange={handleChange}
            />
            Already Read
          </label>

          <label>
            Rating (1–5)
            <select
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              disabled={!formData.read}
            >
              <option value="">No rating</option>
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting
              ? "Saving..."
              : editingBook
                ? "Save Changes"
                : "Add Book"}
          </button>

          {editingBook && (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={submitting}
              className="btn-secondary"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default BookForm;