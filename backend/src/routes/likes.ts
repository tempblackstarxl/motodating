import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { getAuthUser } from "../auth.js";
import { notifyMatch } from "../notify.js";

export async function registerLikeRoutes(app: FastifyInstance) {
  // Поставить лайк. Если есть встречный лайк — создаётся мэтч.
  app.post("/api/likes/:toId", async (req, reply) => {
    const auth = getAuthUser(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { toId } = req.params as { toId: string };
    if (toId === auth.id) return reply.code(400).send({ error: "Не можна лайкнути себе" });

    const target = await prisma.user.findUnique({ where: { id: toId } });
    if (!target) return reply.code(404).send({ error: "Анкету не знайдено" });

    await prisma.like.upsert({
      where: { fromId_toId: { fromId: auth.id, toId } },
      create: { fromId: auth.id, toId },
      update: {},
    });

    // Проверяем встречный лайк
    const reciprocal = await prisma.like.findUnique({
      where: { fromId_toId: { fromId: toId, toId: auth.id } },
    });

    if (!reciprocal) return { matched: false };

    // Создаём мэтч с детерминированным порядком id (для unique-ограничения)
    const [userAId, userBId] = [auth.id, toId].sort();
    const match = await prisma.match.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: { userAId, userBId },
      update: {},
    });

    notifyMatch(auth.id, toId).catch(() => {});

    return { matched: true, match };
  });
}
