"use client";

import axios, { AxiosHeaders, InternalAxiosRequestConfig } from "axios";

// ==========================================================
// Types
// ==========================================================
export type Role = "admin" | "technician" | "staff";

export interface Branch {
  id: number;
  name: string;
}

export interface Division {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  full_name?: string;
  email?: string;
  role: Role;
  branch?: Branch | string | null;
  is_active?: boolean;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface Tokens {
  access: string;
  refresh: string;
}

// ==========================================================
// Axios Instance
// ==========================================================
export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/").replace(/\/?$/, "/"),
  headers: { "Content-Type": "application/json" },
});

// ==========================================================
// Request Interceptor (JWT Token)
// ==========================================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      if (!config.headers) config.headers = new AxiosHeaders();
      else config.headers = AxiosHeaders.from(config.headers);
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================================
// Response Interceptor (Auto Refresh Token)
// ==========================================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      const refresh = localStorage.getItem("refreshToken");
      if (!refresh) {
        logoutUser();
        return Promise.reject(error);
      }

      try {
        const { data } = await api.post<{ access: string }>("auth/refresh/", { refresh });
        localStorage.setItem("accessToken", data.access);

        if (!originalRequest.headers) originalRequest.headers = new AxiosHeaders();
        else originalRequest.headers = AxiosHeaders.from(originalRequest.headers);

        originalRequest.headers.set("Authorization", `Bearer ${data.access}`);
        return api(originalRequest);
      } catch {
        logoutUser();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================================
// Auth Functions
// ==========================================================
export const loginUser = async (payload: LoginPayload): Promise<{ user: User; token: Tokens }> => {
  const { data } = await api.post<LoginResponse>("auth/login/", payload);
  localStorage.setItem("accessToken", data.access);
  localStorage.setItem("refreshToken", data.refresh);
  localStorage.setItem("user", JSON.stringify(data.user));
  return { user: data.user, token: { access: data.access, refresh: data.refresh } };
};

export const logoutUser = () => {
  localStorage.clear();
  window.location.href = "/login";
};

// ==========================================================
// User CRUD Functions
// ==========================================================
export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get<User[]>("users/");
  return data;
};

export const createUser = async (payload: {
  name: string;
  email: string;
  role: Role;
  is_active?: boolean;
}): Promise<User> => {
  const { data } = await api.post<User>("users/", payload);
  return data;
};

export const updateUser = async (
  id: number,
  payload: { name: string; email: string; role: Role; is_active?: boolean }
): Promise<User> => {
  const { data } = await api.put<User>(`users/${id}/`, payload);
  return data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`users/${id}/`);
};

export default api;
