export type Role = "girl" | "rider";

export interface Photo {
  id: string;
  url: string;
  order: number;
}

export interface User {
  id: string;
  username: string | null;
  role: Role;
  name: string;
  age: number;
  city: string;
  bio: string;
  isVisible: boolean;
  photos: Photo[];
}

export interface MatchItem {
  matchId: string;
  createdAt: string;
  user: User | null;
}

export interface CitySuggestion {
  name: string;
  region: string;
  lat: number;
  lng: number;
}
