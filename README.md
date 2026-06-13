# 🏍️ MotoDating

Telegram Mini App для знакомств девушек и мужчин на мотоциклетную тематику. Тестовый MVP.

Подробное ТЗ — в файле [`TЗ.md`](./TЗ.md).

## Что умеет (MVP)

- Анкета: фото (до 5), имя, возраст (18+), город, роль (девушка / мужчина), описание
- Лента анкет противоположной роли с лайками
- Мэтч при взаимном лайке + ссылка «Написать в Telegram»
- Бот со `/start` и кнопкой запуска приложения

## Структура

```
backend/   — API на Fastify + Prisma (SQLite на старте)
frontend/  — Mini App на React + Vite
bot/       — Telegram-бот на grammY
```

## Стек

React + TypeScript + Vite · Fastify · Prisma + SQLite · grammY

## Запуск через Docker (рекомендуется)

Версия Node на хосте не важна — контейнеры используют свой Node 20.

```bash
docker compose up -d --build
```

- Frontend: http://localhost:5173
- Backend (API): http://localhost:3000

БД (SQLite) и загруженные фото хранятся в Docker-томах (`db_data`, `uploads`)
и переживают перезапуск. Остановить: `docker compose down`
(с удалением данных: `docker compose down -v`).

## Запуск без Docker (локально)

Требуется Node.js 18.17+ или 20+.

```bash
# 1. Установить зависимости и подготовить БД (создаст таблицы + тестовые анкеты)
npm install
npm run db:setup --workspace backend

# 2. Запустить backend + frontend разом
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:3000

Вне Telegram приложение работает в **DEV-режиме**: сверху есть панель
переключения «пользователя» — так можно проверить лайки и мэтчи между разными
анкетами (например, выбрать «Тест 1», лайкнуть кого-то, переключиться на «Тест 2»
и лайкнуть в ответ).

## Запуск бота (опционально)

1. Получите токен у [@BotFather](https://t.me/BotFather).
2. Разверните frontend по HTTPS (или поднимите туннель `ngrok http 5173`).
3. Заполните `bot/.env` (см. `bot/.env.example`): `BOT_TOKEN` и `WEBAPP_URL`.
4. Чтобы работали уведомления о мэтчах, добавьте тот же `BOT_TOKEN` в `backend/.env`
   (или раскомментируйте `BOT_TOKEN` у сервиса `backend` в `docker-compose.yml`).
5. Запустите бота:
   - без Docker: `npm run dev:bot`
   - через Docker: `docker compose --profile bot up -d --build bot`

> Когда задан `BOT_TOKEN`, backend переходит в боевой режим и проверяет подпись
> Telegram `initData` вместо DEV-входа.

## Деплой

🆓 **Показать друзьям онлайн бесплатно** — пошаговый гайд в
[`DEPLOY-FREE.md`](./DEPLOY-FREE.md) (один сервис на Render + Telegram, ~20 мин).

Полная инструкция по развёртыванию — в [`DEPLOY.md`](./DEPLOY.md)
(локально, тест в Telegram, прод на VPS, бесплатные облака).

Кратко — см. также раздел «Хостинг и стоимость» в `TЗ.md`. На старте — бесплатные облака
(Vercel + Render + Neon/Supabase + Cloudflare R2), позже переезд на VPS.
Для продакшена поменяйте `provider` в `backend/prisma/schema.prisma` на
`postgresql` и укажите облачный `DATABASE_URL`.
```
