import api from "../api/axios";

const CACHE_TTL = 5 * 60 * 1000;

let cachedCategories = null;
let cachedAt = 0;
let pendingRequest = null;

export const getCategories = async ({ force = false } = {}) => {
  const now = Date.now();

  if (!force && cachedCategories && now - cachedAt < CACHE_TTL) {
    return cachedCategories;
  }

  if (!force && pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = api
    .get("/categories")
    .then((response) => {
      cachedCategories = response.data.data || [];

      cachedAt = Date.now();

      return cachedCategories;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
};

export const clearCategoryCache = () => {
  cachedCategories = null;
  cachedAt = 0;
  pendingRequest = null;
};
