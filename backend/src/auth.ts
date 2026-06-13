import crypto from "node:crypto";
import type { FastifyRequest } from "fastify";

export interface AuthUser {
  id: string;
  firstName?: string;
  username?: string;
}

/**
 * Проверка подписи Telegram initData по алгоритму из документации
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function verifyTelegramInitData(initData: string, botToken: string): AuthUser | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    params.delete("hash");

    const dataCheckString = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join("\n");

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    if (calculatedHash !== hash) return null;

    const userRaw = params.get("user");
    if (!userRaw) return null;
    const user = JSON.parse(userRaw);
    return {
      id: String(user.id),
      firstName: user.first_name,
      username: user.username,
    };
  } catch {
    return null;
  }
}

/**
 * Достаёт пользователя из запроса.
 * В проде — по подписанному Telegram initData (заголовок X-Telegram-Init-Data).
 * В dev-режиме (нет BOT_TOKEN) — по заголовку X-Dev-Id для тестов в браузере.
 */
export function getAuthUser(req: FastifyRequest): AuthUser | null {
  const botToken = process.env.BOT_TOKEN;
  const initData = req.headers["x-telegram-init-data"];

  if (botToken && typeof initData === "string" && initData.length > 0) {
    return verifyTelegramInitData(initData, botToken);
  }

  // Dev-режим: без токена бота пускаем по dev-id (удобно тестировать в браузере)
  if (!botToken) {
    const devId = req.headers["x-dev-id"];
    const id = typeof devId === "string" && devId ? devId : "dev-user-1";
    return { id, firstName: "Dev", username: "dev" };
  }

  return null;
}
