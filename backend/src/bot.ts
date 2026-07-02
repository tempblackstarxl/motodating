import { Bot, InlineKeyboard } from "grammy";

/**
 * Вбудований запуск Telegram-бота прямо з backend (режим "все в одному").
 * Стартує лише якщо задані BOT_TOKEN і WEBAPP_URL — інакше пропускається
 * (щоб у локальному docker-compose, де бот окремим контейнером, не було
 * двох ботів на одному токені).
 */
export function startBot() {
  const token = process.env.BOT_TOKEN;
  const webAppUrl = process.env.WEBAPP_URL;

  if (!token || !webAppUrl) {
    console.log("[bot] BOT_TOKEN/WEBAPP_URL не задані — вбудований бот не запущено");
    return;
  }

  let bot: Bot | null = null;
  let restartScheduled = false;

  const buildBot = () => {
    const b = new Bot(token);

    b.command("start", async (ctx) => {
      const keyboard = new InlineKeyboard().webApp("🏍️ Відкрити MotoDating", webAppUrl);
      await ctx.reply(
        "Привіт! 🏍️❤️\n\nMotoDating — знайомства дівчат і хлопців, що люблять мотоцикли.\n" +
          "Заповни анкету, гортай стрічку і знаходь того, з ким покататися!\n\n" +
          "Лише 18+.",
        { reply_markup: keyboard }
      );
    });

    b.command("help", async (ctx) => {
      await ctx.reply("Натисни /start, щоб відкрити застосунок MotoDating.");
    });

    // Помилки всередині обробників оновлень.
    b.catch((err) => console.error("Помилка бота:", err));

    return b;
  };

  // Перезапуск long polling із затримкою. Потрібен, бо під час деплою
  // старий контейнер ще опитує Telegram і новий отримує 409 Conflict.
  const scheduleRestart = (reason: unknown) => {
    if (restartScheduled) return;
    restartScheduled = true;
    const msg = (reason as { description?: string; message?: string })?.description
      ?? (reason as { message?: string })?.message
      ?? String(reason);
    console.error(`[bot] проблема long polling, перезапуск через 7с: ${msg}`);
    bot?.stop().catch(() => {});
    setTimeout(() => {
      restartScheduled = false;
      launch();
    }, 7000);
  };

  const launch = () => {
    bot = buildBot();
    bot
      .start({ onStart: (me) => console.log(`[bot] @${me.username} запущено.`) })
      .catch((err) => scheduleRestart(err));
  };

  // Помилки циклу опитування можуть спливати як unhandledRejection (поза promise від start()).
  // Не даємо процесу впасти: якщо це помилка бота — перезапускаємо опитування.
  process.on("unhandledRejection", (reason) => {
    const msg = (reason as { description?: string; message?: string })?.description
      ?? (reason as { message?: string })?.message
      ?? String(reason);
    if (typeof msg === "string" && msg.toLowerCase().includes("getupdates")) {
      scheduleRestart(reason);
    } else {
      console.error("[bot] необроблена помилка (проігноровано):", msg);
    }
  });

  launch();
}
