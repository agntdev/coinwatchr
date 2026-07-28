import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { begin, clearFlow, formatMoney, knownTicker, now, prices, state, timeOK } from "../crypto.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();
composer.command("cancel", async (ctx) => { clearFlow(ctx); await ctx.reply("That setup is cancelled. Tap /start when you’re ready."); });
composer.on("message:text", async (ctx, next) => {
  const s = state(ctx); const flow = s.flow; if (!flow) return next();
  if (flow.expiresAt < now()) { clearFlow(ctx); await ctx.reply("That setup timed out. Tap /start to begin again."); return; }
  const value = ctx.message.text.trim();
  if (flow.kind === "addTicker") {
    const coin = knownTicker(value); if (!coin) { await ctx.reply("I couldn’t find that ticker. Try BTC, ETH, TON, SOL, XRP, or DOGE."); return; }
    if (!s.watchlist!.some((item) => item.ticker === coin.ticker)) s.watchlist!.push({ ticker: coin.ticker, name: coin.name, coinId: coin.id, alerts: [] });
    clearFlow(ctx); await ctx.reply(`${coin.name} is on your watchlist. Set an alert when you’re ready.`, { reply_markup: inlineKeyboard([[inlineButton("Set alert rules", `alert:pick:${coin.ticker}`), inlineButton("View watchlist", "watchlist:view")]]) }); return;
  }
  if (flow.kind === "priceTicker") { const coin = knownTicker(value); if (!coin) { await ctx.reply("I couldn’t find that ticker. Try BTC, ETH, TON, SOL, XRP, or DOGE."); return; } clearFlow(ctx); await ctx.replyWithChatAction("typing"); const quote = (await prices([{ ticker: coin.ticker, name: coin.name, coinId: coin.id, alerts: [] }])).get(coin.ticker); await ctx.reply(quote ? `${coin.name} is ${formatMoney(quote.price)} (${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)}% in 24h).` : "I couldn’t reach the price feed. Try again in a moment."); return; }
  if (flow.kind === "alertValue") { const n = Number(value); if (!Number.isFinite(n) || n <= 0) { await ctx.reply("Enter a positive number, then try again."); return; } const item = s.watchlist!.find((x) => x.ticker === flow.ticker); if (!item) { clearFlow(ctx); await ctx.reply("That coin is no longer on your watchlist."); return; } item.alerts.push({ type: flow.alertType!, value: n, enabled: true }); clearFlow(ctx); await ctx.reply(`${flow.alertType === "threshold" ? "Price threshold" : "Percent-move alert"} saved for ${item.name}.`, { reply_markup: inlineKeyboard([[inlineButton("View watchlist", "watchlist:view")]]) }); return; }
  if (!timeOK(value)) { await ctx.reply("Use a 24-hour time like 22:00."); return; }
  if (flow.kind === "quietStart") { begin(ctx, { kind: "quietEnd", ticker: value }); await ctx.reply("When should alerts resume? Send a time like 07:00.", { reply_markup: { force_reply: true, input_field_placeholder: "07:00" } }); return; }
  if (flow.kind === "quietEnd") { s.profile!.quietStart = flow.ticker; s.profile!.quietEnd = value; clearFlow(ctx); await ctx.reply(`Quiet hours are set for ${s.profile!.quietStart}–${value} UTC.`); return; }
  s.profile!.morningSummary = value; clearFlow(ctx); await ctx.reply(`Your daily summary is set for ${value} UTC.`);
});
export default composer;
