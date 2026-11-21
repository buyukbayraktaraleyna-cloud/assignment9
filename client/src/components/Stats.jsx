function Stats({ stats, loading }) {
  if (loading && !stats) {
    return (
      <section aria-label="Reading statistics">
        <p>Loading statistics...</p>
      </section>
    );
  }

  if (!stats) {
    return null;
  }

  const genreEntries = Object.entries(stats.byGenre || {});

  return (
    <section aria-label="Reading statistics" className="stats-panel">
      <h2>Library Overview</h2>
      <div className="stats-grid">
        <div>
          <strong>Total:</strong> {stats.total}
        </div>
        <div>
          <strong>Read:</strong> {stats.read}
        </div>
        <div>
          <strong>Unread:</strong> {stats.unread}
        </div>
        <div>
          <strong>Average Rating:</strong>{" "}
          {stats.averageRating !== null ? `${stats.averageRating} / 5` : "—"}
        </div>
      </div>

      {genreEntries.length > 0 && (
        <p className="stats-genres">
          <strong>By Genre:</strong>{" "}
          {genreEntries
            .map(([genre, count]) => `${genre} (${count})`)
            .join(", ")}
        </p>
      )}
    </section>
  );
}

export default Stats;