import type { FastifyInstance } from "fastify";
import { reverseSettlement, searchSettlements } from "../geo.js";

export async function registerGeoRoutes(app: FastifyInstance) {
  // Автодоповнення населених пунктів: GET /api/cities?q=ні
  app.get("/api/cities", async (req) => {
    const { q } = req.query as { q?: string };
    const items = await searchSettlements(q ?? "");
    return { items };
  });

  // Визначення за локацією: GET /api/cities/reverse?lat=&lng=
  app.get("/api/cities/reverse", async (req, reply) => {
    const { lat, lng } = req.query as { lat?: string; lng?: string };
    const latN = Number(lat);
    const lngN = Number(lng);
    if (!Number.isFinite(latN) || !Number.isFinite(lngN))
      return reply.code(400).send({ error: "Некоректні координати" });
    const item = await reverseSettlement(latN, lngN);
    return { item };
  });
}
