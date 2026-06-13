# All-in-one образ: фронтенд + backend + бот в одном сервисе.
# Удобно для бесплатного хостинга (один сервис, один URL).
# Локальная разработка по-прежнему через docker-compose (отдельные контейнеры).

# --- 1. Сборка фронтенда ---
FROM node:20-slim AS frontend
WORKDIR /fe
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- 2. Backend + встроенный фронтенд + бот ---
FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY backend/package.json ./
RUN npm install

COPY backend/ ./
RUN npx prisma generate

# Кладём собранный фронтенд и говорим backend его раздавать
COPY --from=frontend /fe/dist ./frontend-dist
ENV FRONTEND_DIR=/app/frontend-dist

EXPOSE 3000

# При старте: применяем схему к БД и запускаем сервер (+бот, если задан токен).
# Тестовые анкеты НЕ создаём. Чтобы засеять демо-данные — задайте переменную SEED=1.
CMD ["sh", "-c", "npx prisma db push --skip-generate && { [ \"$SEED\" = \"1\" ] && npx tsx src/seed.ts; } ; npx tsx src/index.ts"]
