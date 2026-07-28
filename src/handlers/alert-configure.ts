import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { begin, state } from "../crypto.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
registerMainMenuItem({ label: "Set alert rules", data: "alert:configure", order: 30 });
const composer = new Composer<Ctx>();
function coinPicker(ctx: Ctx) { const items = state(ctx).watchlist!; return inlineKeyboard([...items.map((item) => [inlineButton(item.name, `alert:pick:${item.ticker}`)]), [inlineButton("Back", "menu:main")]]); }
composer.callbackQuery("alert:configure", async (ctx) => { await ctx.answerCallbackQuery(); const items = state(ctx).watchlist!; if (!items.length) { await ctx.editMessageText("No coins yet — add one before setting alerts.", { reply_markup: inlineKeyboard([[inlineButton("Add a coin", "watchlist:add")]]) }); return; } await ctx.editMessageText("Choose a coin to configure.", { reply_markup: coinPicker(ctx) }); });
composer.callbackQuery(/^alert:pick:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); const ticker = ctx.match[1]; await ctx.editMessageText(`Choose an alert for ${ticker}.`, { reply_markup: inlineKeyboard([[inlineButton("Price threshold", `alert:type:${ticker}:threshold`)], [inlineButton("Percent move", `alert:type:${ticker}:percent`)], [inlineButton("Back", "alert:configure")]]) }); });
composer.callbackQuery(/^alert:type:([^:]+):(threshold|percent)$/, async (ctx) => { await ctx.answerCallbackQuery(); const [, ticker, type] = ctx.match; begin(ctx, { kind: "alertValue", ticker, alertType: type as "threshold" | "percent" }); await ctx.reply(type === "threshold" ? `Send the USD price that should alert you for ${ticker}.` : `Send the percent move that should alert you for ${ticker} in one hour.`, { reply_markup: { force_reply: true, input_field_placeholder: type === "threshold" ? "100000" : "5" } }); });
export default composer;
