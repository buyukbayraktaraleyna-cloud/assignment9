import mongoose from "mongoose";
import { toJSONTransform } from "./toJSON.js";

export const GENRES = [
  "fiction",
  "non-fiction",
  "science",
  "history",
  "fantasy",
  "other",
];

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minLength: [1, "Title must be at least 1 character"],
      maxLength: [100, "Title must be at most 100 characters"],
    },
    author: {
      // Reference to a document in the authors collection
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: [true, "Author is required"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [1000, "Year must be 1000 or later"],
      validate: [
        {
          validator: Number.isInteger,
          message: "Year must be an integer",
        },
        {
          // Compare with the current year at validation time
          validator: (value) => value <= new Date().getFullYear(),
          message: "Year cannot be in the future",
        },
      ],
    },
    genre: {
      type: String,
      enum: {
        values: GENRES,
        message: `Genre must be one of: ${GENRES.join(", ")}`,
      },
      default: "other",
    },
    read: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: null,
      min: [1, "Rating must be between 1 and 5"],
      max: [5, "Rating must be between 1 and 5"],
      validate: [
        {
          validator: (value) => value == null || Number.isInteger(value),
          message: "Rating must be an integer",
        },
        {
          // "this" is the whole document, so the rule also works
          // when only "read" or only "rating" was changed
          validator: function (value) {
            return value == null || this.read === true;
          },
          message: "A rating is allowed only when the book is read",
        },
      ],
    },
    tags: {
      // Embedded array of strings, each one normalised by Mongoose
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
          minLength: [1, "Each tag must be at least 1 character"],
          maxLength: [20, "Each tag must be at most 20 characters"],
        },
      ],
      validate: {
        validator: (tags) => tags.length <= 5,
        message: "A book can have at most 5 tags",
      },
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: { transform: toJSONTransform },
  }
);

// Two books may not have the same title and author.
// The collation with strength 2 makes the title comparison case-insensitive.
bookSchema.index(
  { title: 1, author: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

const Book = mongoose.model("Book", bookSchema);

export default Book;