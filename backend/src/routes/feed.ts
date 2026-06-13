import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { getAuthUser } from "../auth.js";

export async function registerFeedRoutes(app: FastifyInstance) {
  // Лента анкет противоположной роли, которые ещё не лайкнуты текущим пользователем.
  app.get("/api/feed", async (req, reply) => {
    const auth = getAuthUser(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const me = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!me) return reply.code(400).send({ error: "Спочатку створіть анкету" });

    const oppositeRole = me.role === "girl" ? "rider" : "girl";

    const likedIds = (
      await prisma.like.findMany({
        where: { fromId: me.id },
        select: { toId: true },
      })
    ).map((l) => l.toId);

    const users = await prisma.user.findMany({
      where: {
        role: oppositeRole,
        isVisible: true,
        id: { notIn: [me.id, ...likedIds] },
      },
      include: { photos: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { users };
  });
}
