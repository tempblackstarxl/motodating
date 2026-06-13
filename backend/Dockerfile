# Debian-slim вместо alpine: Prisma корректно работает с системным OpenSSL.
FROM node:20-slim

# OpenSSL нужен Prisma для query/schema engine.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Зависимости (кэшируется отдельным слоем)
COPY package.json ./
RUN npm install

# Исходники и Prisma-схема
COPY . ./
RUN npx prisma generate

EXPOSE 3000

# При старте: применяем схему к БД (SQLite на volume), сидим тестовые анкеты, запускаем сервер.
CMD ["sh", "-c", "npx prisma db push --skip-generate && npx tsx src/seed.ts && npx tsx src/index.ts"]
