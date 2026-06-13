interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
  colorScheme?: "light" | "dark";
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export const tg = window.Telegram?.WebApp;

export function initTelegram() {
  if (tg) {
    tg.ready();
    tg.expand();
  }
}

export function getInitData(): string {
  return tg?.initData ?? "";
}

export function isInTelegram(): boolean {
  return Boolean(tg && tg.initData);
}

export function openTelegramChat(username: string) {
  const url = `https://t.me/${username}`;
  if (tg?.openTelegramLink) tg.openTelegramLink(url);
  else window.open(url, "_blank");
}
