import { t } from "./texts";
import type { Role } from "./types";

export const MAX_PHOTOS = 5;
export const MAX_BIO = 500;
export const MIN_AGE = 18;

export const ROLE_LABELS: Record<Role, string> = {
  girl: t.profile.roleGirl,
  rider: t.profile.roleRider,
};

export const DEV_PRESETS: { id: string; label: string }[] = [
  { id: "dev-girl", label: t.dev.girl },
  { id: "dev-rider", label: t.dev.rider },
  { id: "dev-user-1", label: t.dev.test1 },
  { id: "dev-user-2", label: t.dev.test2 },
];
