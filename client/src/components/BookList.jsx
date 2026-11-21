function BookList({
  books,
  loading,
  busyBookId,
  onToggleRead,
  onChangeRating,
  onEdit,
  onDelete,
}) {
  if (loading && books.length === 0) {
    return (
      <section aria-label="Book list">
        <p>Loading books...</p>
      </section>
    );
  }

  return (
    <section aria-label="Book list" className="list-panel">
      <h2>Books ({books.length})</h2>

      {books.length === 0 ? (
        <p className="empty-state">No books found matching your criteria.</p>
      ) : (
        <ul className="book-list">
          {books.map((book) => {
            const isBusy = busyBookId === book.id;

            return (
              <li key={book.id} className="book-card">
                <div className="book-info">
                  <div className="book-header">
                    <strong>{book.title}</strong>
                    <span className="badge genre-badge">{book.genre}</span>
                    <span
                      className={`badge ${book.read ? "badge-read" : "badge-unread"}`}
                    >
                      {book.read ? "Read" : "Unread"}
                    </span>
                  </div>

                  <p className="book-meta">
                    by {book.author} ({book.year})
                  </p>
                </div>

                <div className="book-actions">
                  <label className="inline-rating">
                    Rating:
                    <select
                      aria-label={`Rating for ${book.title}`}
                      value={book.rating !== null ? String(book.rating) : ""}
                      disabled={!book.read || isBusy}
                      onChange={(e) => {
                        const nextRating =
                          e.target.value === "" ? null : Number(e.target.value);
                        onChangeRating(book.id, nextRating);
                      }}
                    >
                      <option value="">—</option>
                      <option value="1">1 ★</option>
                      <option value="2">2 ★</option>
                      <option value="3">3 ★</option>
                      <option value="4">4 ★</option>
                      <option value="5">5 ★</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onToggleRead(book)}
                    className="btn-secondary"
                  >
                    {book.read ? "Mark Unread" : "Mark Read"}
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onEdit(book)}
                    className="btn-secondary"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onDelete(book.id)}
                    className="btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default BookList;