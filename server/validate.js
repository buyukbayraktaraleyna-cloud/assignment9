// Allowed book genres defined by the specification
export const ALLOWED_GENRES = [
  "fiction",
  "non-fiction",
  "science",
  "history",
  "fantasy",
  "other",
];

const ALLOWED_SORT_FIELDS = ["title", "author", "year", "rating"];
const ALLOWED_ORDERS = ["asc", "desc"];

// Validate that a route :id parameter is a positive integer
export function validateIdParam(rawId) {
  if (typeof rawId !== "string" || !/^[1-9]\d*$/.test(rawId)) {
    return {
      valid: false,
      error: "Book id must be a positive integer",
    };
  }

  const parsedId = Number(rawId);
  if (!Number.isSafeInteger(parsedId)) {
    return {
      valid: false,
      error: "Book id is out of safe integer range",
    };
  }

  return { valid: true, value: parsedId };
}

// Validate a complete book object (used by POST, PUT, and merged PATCH)
export function validateCompleteBook(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      valid: false,
      error: "Request body must be a JSON object",
    };
  }

  // Validate title: string, 1 to 100 characters after trimming
  if (typeof body.title !== "string") {
    return { valid: false, error: "Title is required and must be a string" };
  }
  const trimmedTitle = body.title.trim();
  if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
    return {
      valid: false,
      error: "Title must be between 1 and 100 characters after trimming",
    };
  }

  // Validate author: string, 1 to 100 characters after trimming
  if (typeof body.author !== "string") {
    return { valid: false, error: "Author is required and must be a string" };
  }
  const trimmedAuthor = body.author.trim();
  if (trimmedAuthor.length < 1 || trimmedAuthor.length > 100) {
    return {
      valid: false,
      error: "Author must be between 1 and 100 characters after trimming",
    };
  }

  // Validate year: integer between 1000 and the current year
  const currentYear = new Date().getFullYear();
  if (
    typeof body.year !== "number" ||
    !Number.isInteger(body.year) ||
    body.year < 1000 ||
    body.year > currentYear
  ) {
    return {
      valid: false,
      error: `Year must be an integer between 1000 and ${currentYear}`,
    };
  }

  // Validate genre: must be one of the allowed genres
  if (typeof body.genre !== "string" || !ALLOWED_GENRES.includes(body.genre)) {
    return {
      valid: false,
      error: `Genre must be one of: ${ALLOWED_GENRES.join(", ")}`,
    };
  }

  // Validate read: boolean, defaults to false if omitted
  let read = false;
  if (body.read !== undefined) {
    if (typeof body.read !== "boolean") {
      return { valid: false, error: "Read must be a boolean" };
    }
    read = body.read;
  }

  // Validate rating: integer 1..5 or null, defaults to null
  let rating = null;
  if (body.rating !== undefined) {
    if (
      body.rating !== null &&
      (typeof body.rating !== "number" ||
        !Number.isInteger(body.rating) ||
        body.rating < 1 ||
        body.rating > 5)
    ) {
      return {
        valid: false,
        error: "Rating must be an integer between 1 and 5, or null",
      };
    }
    rating = body.rating;
  }

  // Cross-field rule: rating is allowed only when read is true
  if (rating !== null && !read) {
    return {
      valid: false,
      error: "Rating is only allowed when read is true",
    };
  }

  // Return sanitized fields (id and unknown fields are ignored)
  return {
    valid: true,
    data: {
      title: trimmedTitle,
      author: trimmedAuthor,
      year: body.year,
      genre: body.genre,
      read,
      rating,
    },
  };
}

// Validate partial PATCH updates by merging known fields onto the existing book
export function validatePatchBook(body, existingBook) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      valid: false,
      error: "Request body must be a JSON object",
    };
  }

  // Merge only known updatable fields; ignore id and unknown fields
  const merged = {
    title: body.title !== undefined ? body.title : existingBook.title,
    author: body.author !== undefined ? body.author : existingBook.author,
    year: body.year !== undefined ? body.year : existingBook.year,
    genre: body.genre !== undefined ? body.genre : existingBook.genre,
    read: body.read !== undefined ? body.read : existingBook.read,
    rating: body.rating !== undefined ? body.rating : existingBook.rating,
  };

  return validateCompleteBook(merged);
}

// Validate query options for GET /api/books
export function validateBooksQuery(query) {
  // Reject any repeated query parameter (Express parses repeated keys as arrays)
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      return {
        valid: false,
        error: `Query parameter '${key}' must not be repeated`,
      };
    }
  }

  const parsed = {
    genre: undefined,
    read: undefined,
    q: undefined,
    sort: "id",
    order: "asc",
    limit: 50,
    page: 1,
  };

  // Validate genre filter
  if (query.genre !== undefined) {
    if (
      typeof query.genre !== "string" ||
      !ALLOWED_GENRES.includes(query.genre)
    ) {
      return {
        valid: false,
        error: `Invalid genre. Must be one of: ${ALLOWED_GENRES.join(", ")}`,
      };
    }
    parsed.genre = query.genre;
  }

  // Validate read filter ("true" or "false")
  if (query.read !== undefined) {
    if (query.read !== "true" && query.read !== "false") {
      return {
        valid: false,
        error: "Invalid read parameter. Must be 'true' or 'false'",
      };
    }
    parsed.read = query.read === "true";
  }

  // Validate search text q
  if (query.q !== undefined) {
    if (typeof query.q !== "string") {
      return { valid: false, error: "Invalid search query 'q'" };
    }
    parsed.q = query.q.trim();
  }

  // Validate sort field
  if (query.sort !== undefined) {
    if (
      typeof query.sort !== "string" ||
      !ALLOWED_SORT_FIELDS.includes(query.sort)
    ) {
      return {
        valid: false,
        error: `Invalid sort field. Must be one of: ${ALLOWED_SORT_FIELDS.join(", ")}`,
      };
    }
    parsed.sort = query.sort;
  }

  // Validate sort order
  if (query.order !== undefined) {
    if (
      typeof query.order !== "string" ||
      !ALLOWED_ORDERS.includes(query.order)
    ) {
      return {
        valid: false,
        error: "Invalid order. Must be 'asc' or 'desc'",
      };
    }
    parsed.order = query.order;
  }

  // Validate limit (1 to 50, default 50)
  if (query.limit !== undefined) {
    if (typeof query.limit !== "string" || !/^[1-9]\d*$/.test(query.limit)) {
      return {
        valid: false,
        error: "Limit must be an integer between 1 and 50",
      };
    }
    const limitNum = Number(query.limit);
    if (limitNum < 1 || limitNum > 50) {
      return {
        valid: false,
        error: "Limit must be an integer between 1 and 50",
      };
    }
    parsed.limit = limitNum;
  }

  // Validate page (positive integer >= 1, default 1)
  if (query.page !== undefined) {
    if (typeof query.page !== "string" || !/^[1-9]\d*$/.test(query.page)) {
      return {
        valid: false,
        error: "Page must be a positive integer",
      };
    }
    const pageNum = Number(query.page);
    if (!Number.isSafeInteger(pageNum) || pageNum < 1) {
      return {
        valid: false,
        error: "Page must be a positive integer",
      };
    }
    parsed.page = pageNum;
  }

  return { valid: true, value: parsed };
}