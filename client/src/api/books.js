// Read the API base URL from Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Shared helper for all API requests
async function request(path, options = {}) {
  const { body, signal, ...restOptions } = options;

  const headers = {
    ...restOptions.headers,
  };

  // Set Content-Type header ONLY when a request body is present
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  // Handle 204 No Content responses before attempting to parse JSON
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  // Convert server error responses ({ error: "..." }) into a thrown Error
  if (!response.ok) {
    throw new Error(
      data.error || `Request failed with status ${response.status}`
    );
  }

  return data;
}

// Fetch filtered and sorted books using URLSearchParams for safe encoding
export function getBooks(filters = {}, signal) {
  const params = new URLSearchParams();

  if (filters.q && filters.q.trim() !== "") {
    params.set("q", filters.q.trim());
  }
  if (filters.genre && filters.genre !== "all") {
    params.set("genre", filters.genre);
  }
  if (filters.read && filters.read !== "all") {
    params.set("read", filters.read);
  }
  if (filters.sort && filters.sort !== "id") {
    params.set("sort", filters.sort);
  }
  if (filters.order && filters.order !== "asc") {
    params.set("order", filters.order);
  }

  const queryString = params.toString();
  const path = queryString ? `/api/books?${queryString}` : "/api/books";

  return request(path, { method: "GET", signal });
}

// Fetch current library statistics
export function getStats(signal) {
  return request("/api/stats", { method: "GET", signal });
}

// Create a new book (POST)
export function createBook(bookData) {
  return request("/api/books", {
    method: "POST",
    body: bookData,
  });
}

// Replace an existing book completely (PUT)
export function replaceBook(id, bookData) {
  return request(`/api/books/${id}`, {
    method: "PUT",
    body: bookData,
  });
}

// Partially update an existing book (PATCH)
export function patchBook(id, partialData) {
  return request(`/api/books/${id}`, {
    method: "PATCH",
    body: partialData,
  });
}

// Delete a book by ID (DELETE)
export function deleteBook(id) {
  return request(`/api/books/${id}`, {
    method: "DELETE",
  });
}