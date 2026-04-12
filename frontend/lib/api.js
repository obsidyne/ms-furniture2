import { auth } from "@/lib/firebase";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed: ${res.status}`);
  }

  return data;
}

export const api = {
  get:    (path) => request(path, { method: "GET" }),
  post:   (path, body) => request(path, { method: "POST",  body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};