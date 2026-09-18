export const slugify = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const uniqueSlug = (value = "") => `${slugify(value)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
