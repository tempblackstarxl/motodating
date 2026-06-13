import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { getAuthUser } from "../auth.js";

export async function registerMatchRoutes(app: FastifyInstance) {
  // Список мэтчей текущего пользователя вместе с анкетами собеседников.
  app.get("/api/matches", async (req, reply) => {
    const auth = getAuthUser(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const matches = await prisma.match.findMany({
      where: { OR: [{ userAId: auth.id }, { userBId: auth.id }] },
      orderBy: { createdAt: "desc" },
    });

    const otherIds = matches.map((m) => (m.userAId === auth.id ? m.userBId : m.userAId));
    const users = await prisma.user.findMany({
      where: { id: { in: otherIds } },
      include: { photos: { orderBy: { order: "asc" } } },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    const result = matches.map((m) => {
      const otherId = m.userAId === auth.id ? m.userBId : m.userAId;
      return { matchId: m.id, createdAt: m.createdAt, user: byId.get(otherId) ?? null };
    });

    return { matches: result };
  });
}
