import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { state } from "../crypto.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
registerMainMenuItem({ label: "View watchlist", data: "watchlist:view", order: 20 });
const composer = new Composer<Ctx>();
function keyboard(ctx: Ctx) { const items = state(ctx).watchlist!; return inlineKeyboard([...items.map((item) => [inlineButton(`Set alerts for ${item.ticker}`, `alert:pick:${item.ticker}`), inlineButton(`Remove ${item.ticker}`, `watchlist:remove:${item.ticker}`)]), [inlineButton("Add a coin", "watchlist:add"), inlineButton("Back", "menu:main")]]); }
function text(ctx: Ctx) { const items = state(ctx).watchlist!; return items.length ? `Your watchlist\n\n${items.map((item) => `${item.name} (${item.ticker})${item.alerts.length ? ` · ${item.alerts.length} alert${item.alerts.length === 1 ? "" : "s"}` : " · no alerts"}`).join("\n")}` : "No coins yet — tap Add a coin to start your watchlist."; }
composer.callbackQuery("watchlist:view", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText(text(ctx), { reply_markup: keyboard(ctx) }); });
composer.callbackQuery(/^watchlist:remove:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); const ticker = ctx.match[1]; await ctx.editMessageText(`Remove ${ticker} from your watchlist?`, { reply_markup: inlineKeyboard([[inlineButton("Remove", `watchlist:confirm:${ticker}`), inlineButton("Keep it", "watchlist:view")]]) }); });
composer.callbackQuery(/^watchlist:confirm:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); const s = state(ctx); s.watchlist = s.watchlist!.filter((item) => item.ticker !== ctx.match[1]); await ctx.editMessageText(`${ctx.match[1]} was removed.`, { reply_markup: inlineKeyboard([[inlineButton("View watchlist", "watchlist:view")]]) }); });
export default composer;
