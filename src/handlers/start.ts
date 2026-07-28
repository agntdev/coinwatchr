import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, mainMenuKeyboard } from "../toolkit/index.js";

// The /start handler renders the bot's MAIN MENU — the primary way users operate
// a button-first bot. A feature adds its own button by calling
// `registerMainMenuItem(...)` in its own `src/handlers/<slug>.ts`; this handler
// renders whatever is registered (plus a Help button), so you do NOT edit this
// file to add a feature. Send ONE message — no placeholder line above the menu.
const composer = new Composer<Ctx>();

const WELCOME = "Welcome to CryptoAlert. Add Bitcoin, Ethereum, or Toncoin to begin.";
const keyboard = () => { const menu = mainMenuKeyboard(); return inlineKeyboard([[inlineButton("Add Bitcoin", "watchlist:coin:BTC"), inlineButton("Add Ethereum", "watchlist:coin:ETH")], [inlineButton("Add Toncoin", "watchlist:coin:TON")], ...menu.inline_keyboard]); };

composer.command("start", async (ctx) => {
  await ctx.reply(WELCOME, { reply_markup: keyboard() });
});

// "Back to menu" — re-render the main menu in place from any sub-view.
composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(WELCOME, { reply_markup: keyboard() });
});

export default composer;
