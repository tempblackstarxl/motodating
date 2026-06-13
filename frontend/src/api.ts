import { getInitData } from "./telegram";
import type { CitySuggestion, MatchItem, Photo, User } from "./types";

const DEV_ID_KEY = "motodating_dev_id";

export function getDevId(): string {
  return localStorage.getItem(DEV_ID_KEY) ?? "dev-user-1";
}

export function setDevId(id: string) {
  localStorage.setItem(DEV_ID_KEY, id);
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  const initData = getInitData();
  if (initData) h["X-Telegram-Init-Data"] = initData;
  else h["X-Dev-Id"] = getDevId(); // dev-режим для теста в браузере
  return h;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `Ошибка ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getMe(): Promise<{ user: User | null; telegram: { id: string } }> {
    return handle(await fetch("/api/me", { headers: headers() }));
  },

  async saveProfile(input: {
    name: string;
    role: string;
    age: number;
    city: string;
    bio: string;
    isVisible?: boolean;
  }): Promise<{ user: User }> {
    return handle(
      await fetch("/api/me", {
        method: "POST",
        headers: headers({ "content-type": "application/json" }),
        body: JSON.stringify(input),
      })
    );
  },

  async uploadPhoto(file: File): Promise<{ photo: Photo }> {
    const form = new FormData();
    form.append("file", file);
    return handle(
      await fetch("/api/me/photos", { method: "POST", headers: headers(), body: form })
    );
  },

  async deletePhoto(id: string): Promise<{ ok: true }> {
    return handle(
      await fetch(`/api/me/photos/${id}`, { method: "DELETE", headers: headers() })
    );
  },

  async deleteProfile(): Promise<{ ok: true }> {
    return handle(await fetch("/api/me", { method: "DELETE", headers: headers() }));
  },

  async getFeed(): Promise<{ users: User[] }> {
    return handle(await fetch("/api/feed", { headers: headers() }));
  },

  async like(toId: string): Promise<{ matched: boolean }> {
    return handle(
      await fetch(`/api/likes/${toId}`, { method: "POST", headers: headers() })
    );
  },

  async getMatches(): Promise<{ matches: MatchItem[] }> {
    return handle(await fetch("/api/matches", { headers: headers() }));
  },

  async searchCities(q: string): Promise<{ items: CitySuggestion[] }> {
    return handle(await fetch(`/api/cities?q=${encodeURIComponent(q)}`, { headers: headers() }));
  },

  async reverseCity(lat: number, lng: number): Promise<{ item: CitySuggestion | null }> {
    return handle(await fetch(`/api/cities/reverse?lat=${lat}&lng=${lng}`, { headers: headers() }));
  },
};

export function photoUrl(url: string): string {
  return url.startsWith("http") ? url : url; // относительные /uploads идут через прокси
}
