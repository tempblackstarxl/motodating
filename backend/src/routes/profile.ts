import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { getAuthUser } from "../auth.js";

const ROLES = ["girl", "rider"] as const;

export async function registerProfileRoutes(app: FastifyInstance, uploadsDir: string) {
  // Текущий профиль (с фото). null — если ещё не создан.
  app.get("/api/me", async (req, reply) => {
    const auth = getAuthUser(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      include: { photos: { orderBy: { order: "asc" } } },
    });
    return { user, telegram: auth };
  });

  // Создание / обновление анкеты
  app.post("/api/me", async (req, reply) => {
    const auth = getAuthUser(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const role = String(body.role ?? "");
    const age = Number(body.age);
    const city = String(body.city ?? "").trim();
    const bio = String(body.bio ?? "").trim();
    const isVisible = body.isVisible === undefined ? true : Boolean(body.isVisible);

    if (!name || name.length > 40) return reply.code(400).send({ error: "Некоректне ім'я" });
    if (!ROLES.includes(role as (typeof ROLES)[number]))
      return reply.code(400).send({ error: "Некоректна роль" });
    if (!Number.isInteger(age) || age < 18 || age > 99)
      return reply.code(400).send({ error: "Вік має бути 18+" });
    if (city.length < 2 || city.length > 120)
      return reply.code(400).send({ error: "Вкажіть населений пункт" });
    if (bio.length > 500) return reply.code(400).send({ error: "Опис задовгий" });

    const user = await prisma.user.upsert({
      where: { id: auth.id },
      create: { id: auth.id, username: auth.username, name, role, age, city, bio, isVisible },
      update: { username: auth.username, name, role, age, city, bio, isVisible },
      include: { photos: { orderBy: { order: "asc" } } },
    });
    return { user };
  });

  // Загрузка фото (multipart). Хранение локально в uploads/ (на старте).
  app.post("/api/me/photos", async (req, reply) => {
    const auth = getAuthUser(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const exists = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!exists) return reply.code(400).send({ error: "Спочатку створіть анкету" });

    const count = await prisma.photo.count({ where: { userId: auth.id } });
    if (count >= 5) return reply.code(400).send({ error: "Максимум 5 фото" });

    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "Файл не отримано" });

    const ext = (path.extname(data.filename) || ".jpg").toLowerCase();
    const fileName = `${randomUUID()}${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    await pipeline(data.file, fs.createWriteStream(filePath));

    const photo = await prisma.photo.create({
      data: { userId: auth.id, url: `/uploads/${fileName}`, order: count },
    });
    return { photo };
  });

  // Видалення власної анкети разом з фото, лайками та метчами.
  app.delete("/api/me", async (req, reply) => {
    const auth = getAuthUser(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      include: { photos: true },
    });
    if (!user) return { ok: true };

    // Видаляємо файли фото з диска
    for (const p of user.photos) {
      const filePath = path.join(uploadsDir, path.basename(p.url));
      fs.promises.unlink(filePath).catch(() => {});
    }

    // Метчі не мають зовнішніх ключів — чистимо вручну. Лайки/фото видаляються каскадно.
    await prisma.match.deleteMany({
      where: { OR: [{ userAId: auth.id }, { userBId: auth.id }] },
    });
    await prisma.user.delete({ where: { id: auth.id } });

    return { ok: true };
  });

  app.delete("/api/me/photos/:id", async (req, reply) => {
    const auth = getAuthUser(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo || photo.userId !== auth.id)
      return reply.code(404).send({ error: "not found" });

    const filePath = path.join(uploadsDir, path.basename(photo.url));
    fs.promises.unlink(filePath).catch(() => {});
    await prisma.photo.delete({ where: { id } });
    return { ok: true };
  });
}
