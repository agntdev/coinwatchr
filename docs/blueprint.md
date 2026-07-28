# CryptoAlert Bot — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A personal Telegram bot that monitors cryptocurrency prices and sends alerts when coins on users' watchlists cross specified thresholds or move by a set percentage. Users can manage watchlists, set custom alerts, request on-demand price checks, and configure quiet hours. The bot also offers a morning summary and provides the owner with usage statistics.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Telegram users interested in cryptocurrency tracking
- Crypto investors and traders

## Success criteria

- Users can create and manage watchlists with custom tickers
- Alerts are delivered according to user-defined rules and quiet hours
- Morning summaries are sent at the user's chosen local time
- Owner receives daily usage and alert statistics

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu and begin onboarding
- **Add to watchlist** (button, actor: user, callback: watchlist:add) — Add a new coin to the user's watchlist
  - inputs: ticker, alert rules
  - outputs: updated watchlist, confirmation message
- **View watchlist** (button, actor: user, callback: watchlist:view) — Display the user's current watchlist items
  - inputs: none
  - outputs: watchlist items with inline actions
- **Set alert rules** (button, actor: user, callback: alert:configure) — Configure threshold and percent-move alerts for a selected coin
  - inputs: coin selection, alert parameters
  - outputs: updated alert rules
- **/price** (command, actor: user, command: /price) — Request current price for a specific ticker or the entire watchlist
- **Configure quiet hours** (button, actor: user, callback: settings:quiet_hours) — Set time window for suppressing alerts
  - inputs: start time, end time
  - outputs: updated quiet hours settings
- **Enable morning summary** (button, actor: user, callback: settings:morning_summary) — Schedule daily price summary at chosen local time
  - inputs: local time selection
  - outputs: configured summary time

## Flows

### Onboarding
_Trigger:_ /start

1. Display welcome message
2. Show pre-seeded coin buttons
3. Prompt for custom ticker addition
4. Configure initial settings

_Data touched:_ User profile

### Watchlist Management
_Trigger:_ watchlist:add

1. Select coin from buttons or type ticker
2. Confirm coin addition
3. Configure initial alert rules

_Data touched:_ Watchlist item

### Alert Configuration
_Trigger:_ alert:configure

1. Select coin from watchlist
2. Choose alert type (threshold/percent-move)
3. Set parameters
4. Save and confirm

_Data touched:_ Alert rule

### Price Check
_Trigger:_ /price

1. Request ticker input or show full list
2. Fetch current price data
3. Display price and 24h change

_Data touched:_ Watchlist item

### Morning Summary
_Trigger:_ settings:morning_summary

1. Select local time for summary
2. Confirm schedule
3. Send summary at scheduled time

_Data touched:_ User profile

### Quiet Hours
_Trigger:_ settings:quiet_hours

1. Select start and end times
2. Confirm schedule
3. Queue alerts during quiet hours

_Data touched:_ User profile

### Alert Delivery
_Trigger:_ price threshold crossed or percent move detected

1. Check alert rules
2. Verify quiet hours
3. Send alert notification
4. Apply cooldown period

_Data touched:_ Alert event log, Watchlist item

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User profile** _(retention: persistent)_ — Stores user-specific settings and preferences
  - fields: Telegram id, timezone, quiet hours, morning-summary time, cooldown period
- **Watchlist item** _(retention: persistent)_ — Represents a cryptocurrency on a user's watchlist
  - fields: ticker, display name, alerts, last-notified timestamp
- **Alert rule** _(retention: persistent)_ — Defines conditions for price alerts
  - fields: type, value, enabled
- **Alert event log** _(retention: persistent)_ — Tracks triggered alerts for analytics and cooldown
  - fields: coin, old price, new price, percent change, timestamp, user id

## Integrations

- **Telegram** (required) — Bot API messaging
- **Crypto price feed** (required) — Fetch current price data
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Send daily usage and alert statistics to admin Telegram chat
- Configure default cooldown period
- Set pre-seeded coin buttons
- View top-fired alerts

## Notifications

- Price alerts with coin details and change percentages
- Morning summary of watchlist prices
- Owner usage reports with top-fired alerts
- Error notifications for failed price fetches

## Permissions & privacy

- All watchlists and alert settings are private to each user
- No cross-user visibility of personal data
- Quiet hours and summary preferences are stored securely
- Alert event logs are anonymized for owner reports

## Edge cases

- Handling unknown tickers with helpful suggestions
- Queueing alerts during quiet hours and delivering after
- Managing cooldown periods to prevent alert spam
- Retrying failed price fetches without user interruption

## Required tests

- Verify alert delivery during non-quiet hours
- Test morning summary at scheduled time
- Validate watchlist management flows
- Confirm error handling for invalid tickers

## Assumptions

- Default cooldown period is 1 hour
- Percent-move timeframe defaults to 1 hour
- Pre-seeded coins include Bitcoin, Ethereum, and Toncoin
- Morning summary is a single daily message
- Owner reports are sent to a single admin chat
