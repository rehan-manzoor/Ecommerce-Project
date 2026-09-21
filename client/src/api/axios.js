import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

let accessToken = null;
let renewing = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

const getCookie = (name) => {
  if (typeof document === "undefined") return null;

  const prefix = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
};

const addCsrfHeader = (config) => {
  const method = String(config.method || "get").toLowerCase();
  const needsCsrf =
    method !== "get" &&
    method !== "head" &&
    method !== "options" &&
    (config.url?.includes("/users/refresh") || config.url?.includes("/users/logout"));

  if (needsCsrf) {
    const csrfToken = getCookie("csrfToken");
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers["X-CSRF-Token"] = csrfToken;
    }
  }

  return config;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return addCsrfHeader(config);
});

const refreshAccessToken = async () => {
  const csrfToken = getCookie("csrfToken");

  const response = await axios.post(
    `${API_BASE_URL}/users/refresh`,
    {},
    {
      withCredentials: true,
      headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
    }
  );

  const token = response.data.data.token;
  accessToken = token;
  return token;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (
      error.response?.status === 401 &&
      config &&
      !config._retried &&
      !config.url?.includes("/users/refresh") &&
      !config.url?.includes("/users/login")
    ) {
      config._retried = true;

      try {
        renewing ||= refreshAccessToken();
        const token = await renewing;
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      } catch {
        accessToken = null;
      } finally {
        renewing = null;
      }
    }

    return Promise.reject(error);
  }
);

export const ensureCsrfToken = async () => {
  if (getCookie("csrfToken")) return;
  await api.get("/users/csrf");
};

export default api;
