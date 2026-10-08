// Base URL of the FastAPI backend, including the version prefix.
// Set NEXT_PUBLIC_API_BASE_URL in .env.local to override the local default.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
