# 🚀 Развёртывание MotoDating

Инструкция по запуску приложения: от локального теста до продакшена.

Состав приложения:
- **backend** — API (Fastify + Prisma), порт `3000`
- **frontend** — Mini App (React, в Docker раздаётся через nginx)
- **bot** — Telegram-бот (grammY, long polling)

---

## Содержание
1. [Локальный запуск (Docker)](#1-локальный-запуск-docker)
2. [Тест в реальном Telegram (бот + туннель)](#2-тест-в-реальном-telegram)
3. [Продакшен на VPS (Docker + домен + HTTPS)](#3-продакшен-на-vps)
4. [Переход с SQLite на PostgreSQL](#4-переход-на-postgresql)
5. [Альтернатива: бесплатные облака](#5-альтернатива-бесплатные-облака)
6. [Переменные окружения](#6-переменные-окружения)
7. [Чек-лист перед запуском](#7-чек-лист-перед-запуском)

---

## 1. Локальный запуск (Docker)

Требуется установленный **Docker** (Docker Desktop). Версия Node на машине не важна.

```bash
docker compose up -d --build
```

- Frontend: http://localhost:5173
- Backend (API): http://localhost:3000

Вне Telegram приложение работает в DEV-режиме (вверху панель переключения тестовых
пользователей — для проверки лайков и мэтчей).

Полезные команды:
```bash
docker compose logs -f backend     # логи
docker compose down                # остановить
docker compose down -v             # остановить и стереть данные (БД, фото)
```

---

## 2. Тест в реальном Telegram

Чтобы открыть приложение внутри Telegram, нужны: **бот** и **HTTPS-адрес** фронтенда.
Локально HTTPS-адрес даёт туннель.

### 2.1 Создать бота
1. Напиши [@BotFather](https://t.me/BotFather) → `/newbot` → задай имя и username.
2. Скопируй **токен** (вида `123456:ABC-DEF...`).

### 2.2 Поднять HTTPS-туннель на фронтенд
Например, через cloudflared или ngrok (фронт на порту 5173):
```bash
# вариант 1
cloudflared tunnel --url http://localhost:5173
# вариант 2
ngrok http 5173
```
Получишь адрес вида `https://xxxx.trycloudflare.com` — это твой `WEBAPP_URL`.

### 2.3 Прописать переменные
`bot/.env` (скопируй из `bot/.env.example`):
```env
BOT_TOKEN=123456:ABC-DEF...
WEBAPP_URL=https://xxxx.trycloudflare.com
```
`backend/.env` — добавь тот же токен (включает проверку подписи Telegram и уведомления о мэтчах):
```env
BOT_TOKEN=123456:ABC-DEF...
```

> Важно: как только в backend задан `BOT_TOKEN`, DEV-режим отключается и вход
> работает только через настоящий Telegram `initData`.

### 2.4 Запустить
```bash
docker compose up -d --build                      # backend + frontend
docker compose --profile bot up -d --build bot    # бот
```
Открой бота в Telegram → `/start` → кнопка «Відкрити MotoDating».

### 2.5 (Опционально) Кнопка-меню у бота
В @BotFather: `/setmenubutton` → выбери бота → укажи URL `WEBAPP_URL` и текст кнопки.

---

## 3. Продакшен на VPS

Самый простой путь для этого проекта (он уже контейнеризирован).
Подойдёт любой VPS (Hetzner, DigitalOcean и т.п.), ~$5–10/мес.

### 3.1 Подготовка сервера
```bash
# на VPS (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
git clone <ваш-репозиторий> motodating && cd motodating
```

### 3.2 Домен
Купи домен и направь A-запись на IP сервера (например, `app.example.com → 1.2.3.4`).

### 3.3 HTTPS через Caddy (авто-сертификаты Let's Encrypt)
Caddy ставится «перед» фронтендом и сам выпускает TLS-сертификат.

Создай `docker-compose.prod.yml`:
```yaml
name: motodating
services:
  caddy:
    image: caddy:2-alpine
    depends_on: [frontend]
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    restart: unless-stopped
volumes:
  caddy_data:
  caddy_config:
```

Создай `Caddyfile` (подставь свой домен):
```
app.example.com {
    reverse_proxy frontend:80
}
```

В `docker-compose.yml` убери публикацию портов у `frontend` и `backend`
(наружу торчит только Caddy). То есть удали/закомментируй блоки `ports:` у этих сервисов.

### 3.4 Переменные окружения (прод)
В `docker-compose.yml` у сервиса `backend` задай:
```yaml
    environment:
      - DATABASE_URL=file:/data/dev.db   # или postgres, см. раздел 4
      - BOT_TOKEN=123456:ABC-DEF...
```
В `bot/.env`:
```env
BOT_TOKEN=123456:ABC-DEF...
WEBAPP_URL=https://app.example.com
```

### 3.5 Запуск
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose --profile bot up -d --build bot
```
Через минуту по адресу `https://app.example.com` поднимется приложение с валидным сертификатом.
Укажи этот адрес как Web App URL в @BotFather (раздел 2.5).

### 3.6 Обновление версии
```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 4. Переход на PostgreSQL

SQLite хорош для старта/теста. Для продакшена рекомендуется PostgreSQL.

1. В `backend/prisma/schema.prisma` поменяй провайдер:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Подними Postgres. Вариант — добавить сервис в `docker-compose.prod.yml`:
   ```yaml
   services:
     postgres:
       image: postgres:16-alpine
       environment:
         - POSTGRES_USER=motodating
         - POSTGRES_PASSWORD=ЗАМЕНИ_МЕНЯ
         - POSTGRES_DB=motodating
       volumes:
         - pg_data:/var/lib/postgresql/data
       restart: unless-stopped
   volumes:
     pg_data:
   ```
3. Укажи строку подключения у `backend`:
   ```yaml
   - DATABASE_URL=postgresql://motodating:ЗАМЕНИ_МЕНЯ@postgres:5432/motodating
   ```
4. Контейнер backend при старте сам выполнит `prisma db push` и создаст таблицы.
   (Тестовые анкеты из seed можно потом удалить.)

> Фото сейчас хранятся на диске (volume `uploads`). На одном VPS этого достаточно.
> Для масштабирования/нескольких инстансов перенеси их в S3-совместимое
> хранилище (Cloudflare R2, Supabase Storage) — это доработка backend.

---

## 5. Альтернатива: бесплатные облака

Стоимость ~$0/мес, но больше ручной настройки и есть нюансы (например, «засыпание»
backend на бесплатном тарифе).

| Компонент | Сервис | Как |
|-----------|--------|-----|
| Frontend | **Vercel** / Cloudflare Pages | деплой папки `frontend` (Vite). Задать переменную прокси/`VITE_API_TARGET` на адрес backend |
| Backend | **Render** (Web Service) | Docker или Node; команда старта `npm run start --workspace backend`; задать env-переменные |
| База | **Neon** / Supabase | Postgres; строку подключения → `DATABASE_URL` (см. раздел 4) |
| Фото | **Cloudflare R2** | доработка backend для загрузки в R2 |
| Бот | контейнер/сервис | задать `BOT_TOKEN`, `WEBAPP_URL` (адрес фронта) |

> На облаках фронт и бэк на разных доменах — настрой CORS (он уже включён) и адрес API.
> Проще и предсказуемее для этого проекта — VPS из раздела 3.

---

## 6. Переменные окружения

### backend (`backend/.env` или `environment` в compose)
| Переменная | Назначение | Пример |
|-----------|-----------|--------|
| `DATABASE_URL` | строка подключения к БД | `file:/data/dev.db` или `postgresql://...` |
| `PORT` | порт API | `3000` |
| `HOST` | хост | `0.0.0.0` |
| `BOT_TOKEN` | токен бота. Если задан — включается проверка Telegram `initData` и уведомления о мэтчах. Если пуст — DEV-режим | `123456:ABC...` |

### bot (`bot/.env`)
| Переменная | Назначение | Пример |
|-----------|-----------|--------|
| `BOT_TOKEN` | токен от @BotFather | `123456:ABC...` |
| `WEBAPP_URL` | HTTPS-адрес Mini App (фронтенда) | `https://app.example.com` |

> Файлы `.env` не коммитятся (см. `.gitignore`). Используй `*.env.example` как шаблон.

---

## 7. Чек-лист перед запуском в прод

- [ ] Куплен домен, A-запись указывает на сервер
- [ ] Получен `BOT_TOKEN` у @BotFather
- [ ] `WEBAPP_URL` указывает на HTTPS-адрес фронтенда
- [ ] `BOT_TOKEN` задан и в `backend`, и в `bot` (DEV-режим выключен)
- [ ] БД переведена на PostgreSQL (раздел 4)
- [ ] Настроен HTTPS (Caddy/раздел 3.3)
- [ ] В @BotFather указан Web App URL / кнопка-меню
- [ ] Проверена регистрация, лента, лайк → мэтч, уведомление в боте
- [ ] Решён вопрос с геокодером: публичный Photon ок для старта, для нагрузки —
      свой Photon/Nominatim или платный геокодер
- [ ] Настроены бэкапы БД и тома `uploads`

---

## Частые вопросы

**Нужен ли вебхук для бота?** Нет. Бот работает на long polling — достаточно
доступа в интернет, белый IP/вебхук не требуется.

**Почему приложение не открывается в Telegram?** Telegram требует **HTTPS** для
Mini App. Локальный `http://localhost` не подойдёт — нужен туннель или домен.

**Бэкенду нужен интернет?** Да — для подсказок городов (OpenStreetMap/Photon)
и для отправки уведомлений о мэтчах через Telegram API.
