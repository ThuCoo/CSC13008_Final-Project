/// <reference types="vite/client" />
import axios, { InternalAxiosRequestConfig } from "axios";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function resolveApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
  const trimmed = raw.trim();
  if (!trimmed) return "/api";
  return normalizeBaseUrl(trimmed);
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    config.headers.set("apikey", apiKey);
  }

  const token = localStorage.getItem("token");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

export default apiClient;
