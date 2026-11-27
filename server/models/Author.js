import mongoose from "mongoose";
import { toJSONTransform } from "./toJSON.js";

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minLength: [1, "Name must be at least 1 character"],
      maxLength: [100, "Name must be at most 100 characters"],
      // Creates a unique index: no two authors may share the same name
      unique: true,
    },
    born: {
      type: Number,
      min: [1000, "Born must be 1000 or later"],
      validate: [
        {
          // Optional field: only check it when a value is present
          validator: (value) => value == null || Number.isInteger(value),
          message: "Born must be an integer",
        },
        {
          // Compare with the current year at validation time
          validator: (value) =>
            value == null || value <= new Date().getFullYear(),
          message: "Born cannot be in the future",
        },
      ],
    },
  },
  {
    // Adds createdAt and updatedAt automatically
    timestamps: true,
    // Unknown fields in a request body are ignored
    strict: true,
    toJSON: { transform: toJSONTransform },
  }
);

const Author = mongoose.model("Author", authorSchema);

export default Author;