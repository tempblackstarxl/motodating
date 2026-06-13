import "dotenv/config";
import { Bot, InlineKeyboard } from "grammy";

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

if (!token) {
  console.error("Не задано BOT_TOKEN. Отримайте токен у @BotFather і додайте в bot/.env");
  process.exit(1);
}
if (!webAppUrl) {
  console.error("Не задано WEBAPP_URL (https-адреса Mini App). Додайте його в bot/.env");
  process.exit(1);
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

bot.start({ onStart: (me) => console.log(`Бот @${me.username} запущено.`) });
