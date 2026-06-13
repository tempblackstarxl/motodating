import "dotenv/config";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { registerProfileRoutes } from "./routes/profile.js";
import { registerFeedRoutes } from "./routes/feed.js";
import { registerLikeRoutes } from "./routes/likes.js";
import { registerMatchRoutes } from "./routes/matches.js";
import { registerGeoRoutes } from "./routes/geo.js";
import { startBot } from "./bot.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

// Режим "все в одному": якщо є зібраний фронтенд — backend його роздає.
const frontendDir = process.env.FRONTEND_DIR
  ? path.resolve(process.env.FRONTEND_DIR)
  : path.resolve(__dirname, "../../frontend/dist");
const serveFrontend = fs.existsSync(path.join(frontendDir, "index.html"));

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(multipart, { limits: { fileSize: 8 * 1024 * 1024 } });
await app.register(fastifyStatic, { root: uploadsDir, prefix: "/uploads/" });

app.get("/api/health", async () => ({ ok: true }));

await registerProfileRoutes(app, uploadsDir);
await registerFeedRoutes(app);
await registerLikeRoutes(app);
await registerMatchRoutes(app);
await registerGeoRoutes(app);

// Роздача зібраного фронтенду + SPA-fallback (тільки в режимі "все в одному").
if (serveFrontend) {
  await app.register(fastifyStatic, {
    root: frontendDir,
    prefix: "/",
    decorateReply: false,
  });
  app.setNotFoundHandler((req, reply) => {
    const url = req.raw.url ?? "";
    if (url.startsWith("/api") || url.startsWith("/uploads")) {
      reply.code(404).send({ error: "not found" });
      return;
    }
    reply.sendFile("index.html", frontendDir);
  });
  console.log(`Фронтенд роздається з ${frontendDir}`);
}

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`MotoDating backend запущен на http://localhost:${PORT}`);
  startBot();
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
