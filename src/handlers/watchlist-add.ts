import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { begin, knownTicker, state } from "../crypto.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "Add a coin", data: "watchlist:add", order: 10 });
const composer = new Composer<Ctx>();
const choices = inlineKeyboard([[inlineButton("Bitcoin", "watchlist:coin:BTC"), inlineButton("Ethereum", "watchlist:coin:ETH")], [inlineButton("Toncoin", "watchlist:coin:TON"), inlineButton("Type a ticker", "watchlist:custom")], [inlineButton("Back", "menu:main")]]);
composer.callbackQuery("watchlist:add", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText("Choose a coin, or type its ticker.", { reply_markup: choices }); });
composer.callbackQuery(/^watchlist:coin:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); const coin = knownTicker(ctx.match[1]); if (!coin) return; const s = state(ctx); if (s.watchlist!.some((item) => item.ticker === coin.ticker)) { await ctx.editMessageText(`${coin.name} is already on your watchlist.`, { reply_markup: inlineKeyboard([[inlineButton("Set alert rules", `alert:pick:${coin.ticker}`), inlineButton("View watchlist", "watchlist:view")]]) }); return; } s.watchlist!.push({ ticker: coin.ticker, name: coin.name, coinId: coin.id, alerts: [] }); await ctx.editMessageText(`${coin.name} is on your watchlist. Set an alert when you’re ready.`, { reply_markup: inlineKeyboard([[inlineButton("Set alert rules", `alert:pick:${coin.ticker}`), inlineButton("View watchlist", "watchlist:view")]]) }); });
composer.callbackQuery("watchlist:custom", async (ctx) => { await ctx.answerCallbackQuery(); begin(ctx, { kind: "addTicker" }); await ctx.reply("Send a ticker, such as SOL or XRP.", { reply_markup: { force_reply: true, input_field_placeholder: "SOL" } }); });
export default composer;
