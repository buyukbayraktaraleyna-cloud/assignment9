const GENRE_OPTIONS = [
  "fiction",
  "non-fiction",
  "science",
  "history",
  "fantasy",
  "other",
];

function Controls({ filters, onFilterChange, onReset }) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onFilterChange(name, value);
  };

  const hasActiveFilters =
    filters.q !== "" ||
    filters.genre !== "all" ||
    filters.read !== "all" ||
    filters.sort !== "id" ||
    filters.order !== "asc";

  return (
    <section aria-label="Filter and sort books" className="controls-panel">
      <h2>Search & Filter</h2>
      <div className="controls-grid">
        <label>
          Search (Title or Author)
          <input
            type="search"
            name="q"
            value={filters.q}
            onChange={handleChange}
            placeholder="e.g. Dune or Orwell"
          />
        </label>

        <label>
          Genre
          <select name="genre" value={filters.genre} onChange={handleChange}>
            <option value="all">All Genres</option>
            {GENRE_OPTIONS.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select name="read" value={filters.read} onChange={handleChange}>
            <option value="all">All</option>
            <option value="true">Read</option>
            <option value="false">Unread</option>
          </select>
        </label>

        <label>
          Sort By
          <select name="sort" value={filters.sort} onChange={handleChange}>
            <option value="id">Default (ID)</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="year">Year</option>
            <option value="rating">Rating</option>
          </select>
        </label>

        <label>
          Order
          <select name="order" value={filters.order} onChange={handleChange}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>

        {hasActiveFilters && (
          <button type="button" onClick={onReset} className="btn-secondary">
            Reset Filters
          </button>
        )}
      </div>
    </section>
  );
}

export default Controls;