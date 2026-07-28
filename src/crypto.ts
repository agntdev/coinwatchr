import type { Context } from "grammy";

export type AlertType = "threshold" | "percent";
export interface AlertRule { type: AlertType; value: number; enabled: boolean; }
export interface WatchItem { ticker: string; name: string; coinId: string; alerts: AlertRule[]; lastPrice?: number; lastNotifiedAt?: number; queued?: boolean; }
export interface Profile { telegramId: number; timezone: string; quietStart?: string; quietEnd?: string; morningSummary?: string; cooldownMs: number; }
export type Flow = { kind: "addTicker" | "priceTicker" | "alertValue" | "quietStart" | "quietEnd" | "summaryTime"; ticker?: string; alertType?: AlertType; expiresAt: number };
export interface CryptoState { profile?: Profile; watchlist?: WatchItem[]; flow?: Flow; events?: { ticker: string; at: number }[]; }

const COINS: Record<string, { name: string; id: string }> = {
  BTC: { name: "Bitcoin", id: "bitcoin" }, ETH: { name: "Ethereum", id: "ethereum" }, TON: { name: "Toncoin", id: "the-open-network" },
  SOL: { name: "Solana", id: "solana" }, XRP: { name: "XRP", id: "ripple" }, DOGE: { name: "Dogecoin", id: "dogecoin" },
};
let clock: () => number = () => Date.now();
/** Test seam for schedule and cooldown decisions. */
export function setNow(fn: () => number): void { clock = fn; }
export function now(): number { return clock(); }

export function state(ctx: Context): CryptoState {
  const session = (ctx as Context & { session: CryptoState }).session;
  session.watchlist ??= [];
  session.events ??= [];
  if (ctx.from && !session.profile) session.profile = { telegramId: ctx.from.id, timezone: "UTC", cooldownMs: 60 * 60 * 1000 };
  return session;
}
export function knownTicker(value: string): { ticker: string; name: string; id: string } | undefined {
  const ticker = value.trim().toUpperCase(); const coin = COINS[ticker];
  return coin ? { ticker, name: coin.name, id: coin.id } : undefined;
}
export function begin(ctx: Context, flow: Omit<Flow, "expiresAt">): void { state(ctx).flow = { ...flow, expiresAt: now() + 5 * 60 * 1000 }; }
export function clearFlow(ctx: Context): void { state(ctx).flow = undefined; }
export function timeOK(value: string): boolean { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
export function inQuietHours(profile: Profile, at = now()): boolean {
  if (!profile.quietStart || !profile.quietEnd) return false;
  const d = new Date(at); const minute = d.getUTCHours() * 60 + d.getUTCMinutes();
  const toMinutes = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
  const a = toMinutes(profile.quietStart), b = toMinutes(profile.quietEnd);
  return a === b ? false : a < b ? minute >= a && minute < b : minute >= a || minute < b;
}
export function formatMoney(value: number): string { return value >= 1 ? `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `$${value.toPrecision(4)}`; }

export interface Quote { price: number; change: number; }
export async function prices(items: WatchItem[]): Promise<Map<string, Quote>> {
  const ids = [...new Set(items.map((item) => item.coinId))];
  if (!ids.length) return new Map();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd&include_24hr_change=true`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { headers: { accept: "application/json" } });
      if (!response.ok) { if (response.status === 429 && attempt === 0) continue; return new Map(); }
      const body = await response.json() as Record<string, { usd?: number; usd_24h_change?: number }>;
      return new Map(items.flatMap((item) => {
        const q = body[item.coinId];
        return typeof q?.usd === "number" ? [[item.ticker, { price: q.usd, change: q.usd_24h_change ?? 0 }] as const] : [];
      }));
    } catch { if (attempt === 1) return new Map(); }
  }
  return new Map();
}

/** Records cooldown-safe events; callers send only returned alerts. */
export function triggered(ctx: Context, item: WatchItem, quote: Quote): AlertRule[] {
  const profile = state(ctx).profile!; const previous = item.lastPrice; const eligible = (item.lastNotifiedAt ?? 0) + profile.cooldownMs <= now();
  const rules = item.alerts.filter((rule) => rule.enabled && eligible && (
    rule.type === "threshold" ? quote.price >= rule.value : previous !== undefined && Math.abs(((quote.price - previous) / previous) * 100) >= rule.value
  ));
  item.lastPrice = quote.price;
  if (rules.length) { item.lastNotifiedAt = now(); state(ctx).events!.push({ ticker: item.ticker, at: now() }); }
  return rules;
}
