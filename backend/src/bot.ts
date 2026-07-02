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

  const bot = new Bot(token);

  bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard().webApp("🏍️ Відкрити MotoDating", webAppUrl);
    await ctx.reply(
      "Привіт! 🏍️❤️\n\nMotoDating — знайомства дівчат і хлопців, що люблять мотоцикли.\n" +
        "Заповни анкету, гортай стрічку і знаходь того, з ким покататися!\n\n" +
        "Лише 18+.",
      { reply_markup: keyboard }
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply("Натисни /start, щоб відкрити застосунок MotoDating.");
  });

  bot.catch((err) => console.error("Помилка бота:", err));

  // Long polling. У момент деплою можливий конфлікт 409 (стара ревізія ще
  // опитує Telegram) — не падаємо, а повторюємо спробу, поки не станемо єдиним інстансом.
  const launch = () => {
    bot
      .start({ onStart: (me) => console.log(`[bot] @${me.username} запущено.`) })
      .catch((err) => {
        const msg = err?.message ?? String(err);
        console.error(`[bot] помилка long polling, повтор через 5с: ${msg}`);
        setTimeout(launch, 5000);
      });
  };
  launch();
}
