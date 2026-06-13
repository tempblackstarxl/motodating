import { prisma } from "./db.js";

/**
 * Уведомление о мэтче через Telegram-бота.
 * Работает только если задан BOT_TOKEN и пользователь запускал бота.
 * Без токена — просто логируем (dev-режим).
 */
export async function notifyMatch(userAId: string, userBId: string) {
  const token = process.env.BOT_TOKEN;
  const [a, b] = await Promise.all([
    prisma.user.findUnique({ where: { id: userAId } }),
    prisma.user.findUnique({ where: { id: userBId } }),
  ]);
  if (!a || !b) return;

  if (!token) {
    console.log(`[match] ${a.name} <-> ${b.name} (немає BOT_TOKEN — сповіщення пропущено)`);
    return;
  }

  await Promise.all([
    sendMatchMessage(token, a.id, b),
    sendMatchMessage(token, b.id, a),
  ]);
}

async function sendMatchMessage(
  token: string,
  chatId: string,
  other: { name: string; username: string | null }
) {
  const link = other.username ? `https://t.me/${other.username}` : null;
  const text = link
    ? `🔥 Взаємний лайк із ${other.name}! Напишіть перші: ${link}`
    : `🔥 У вас метч із ${other.name}! Відкрийте застосунок, щоб продовжити.`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (err) {
    console.error("Не удалось отправить уведомление о мэтче:", err);
  }
}
