# Stock AI Trader

NestJS trading MVP for Bursa Malaysia and US stock analysis. The app supports switchable broker adapters, stores decisions in Postgres, and treats OpenAI as an analyst only.

## Local Docker Setup

Copy the environment template if needed:

```bash
cp .env.example .env
```

Start the app and Postgres:

```bash
docker compose up
```

Run tests:

```bash
docker compose exec app npm run test
```

Run Prisma commands:

```bash
docker compose exec app npm run prisma:generate
docker compose exec app npm run prisma:migrate -- --name init
```

Run one-off npm commands without installing Node locally:

```bash
docker run --rm -v "$PWD:/app" -w /app node:24 npm install
docker run --rm -v "$PWD:/app" -w /app node:24 npm run test
```

## Broker Modes

Local mock paper trading works now and does not connect to Moomoo:

```env
BROKER_PROVIDER=mock
BROKER_ENV=SIMULATE
ENABLE_LIVE_TRADING=false
```

Alpaca paper mode is a pure REST API path for US stocks/ETFs:

```env
BROKER_PROVIDER=alpaca
BROKER_ENV=SIMULATE
ENABLE_LIVE_TRADING=false
ALPACA_API_KEY_ID=your-paper-key-id
ALPACA_SECRET_KEY=your-paper-secret-key
ALPACA_PAPER_BASE_URL=https://paper-api.alpaca.markets
```

Alpaca live mode is selectable when explicitly enabled:

```env
BROKER_PROVIDER=alpaca
BROKER_ENV=REAL
ENABLE_LIVE_TRADING=true
ALPACA_API_KEY_ID=your-live-key-id
ALPACA_SECRET_KEY=your-live-secret-key
ALPACA_LIVE_BASE_URL=https://api.alpaca.markets
```

Moomoo paper/demo mode is selectable in config:

```env
BROKER_PROVIDER=moomoo
BROKER_ENV=SIMULATE
ENABLE_LIVE_TRADING=false
MOOMOO_OPEND_HOST=host.docker.internal
MOOMOO_OPEND_PORT=11111
MOOMOO_ACCOUNT_ID_MY=your-my-paper-account
MOOMOO_ACCOUNT_ID_US=your-us-paper-account
```

Moomoo live mode is also selectable when you explicitly enable it:

```env
BROKER_PROVIDER=moomoo
BROKER_ENV=REAL
ENABLE_LIVE_TRADING=true
MOOMOO_OPEND_HOST=host.docker.internal
MOOMOO_OPEND_PORT=11111
MOOMOO_ACCOUNT_ID_MY=your-my-live-account
MOOMOO_ACCOUNT_ID_US=your-us-live-account
MOOMOO_TRADE_UNLOCK_PASSWORD=your-unlock-password
```

Alpaca only supports `market=US` in this app. Use Moomoo for `market=MY` Bursa Malaysia order attempts.

Switching Moomoo paper/live is not just an API key change. Moomoo OpenAPI models trading environment as `SIMULATE` or `REAL`, uses market/account identifiers, connects through OpenD host/port, and live trading requires trade unlock credentials.

## Alpaca Paper Trading Test

Set `.env` to Alpaca paper mode:

```env
BROKER_PROVIDER=alpaca
BROKER_ENV=SIMULATE
ENABLE_LIVE_TRADING=false
ALPACA_API_KEY_ID=your-paper-key-id
ALPACA_SECRET_KEY=your-paper-secret-key
ALPACA_PAPER_BASE_URL=https://paper-api.alpaca.markets
```

Start the app:

```bash
docker compose up
```

Trigger a US paper order test:

```bash
curl -X POST http://localhost:3000/broker/paper-order/test \
  -H 'Content-Type: application/json' \
  -d '{"market":"US","symbol":"AAPL","side":"BUY","quantity":1,"limitPrice":1}'
```

## Moomoo Paper Trading Test

To test against Moomoo paper/demo instead of the local mock broker:

1. Install and start Moomoo OpenD on your host machine.
2. Log in to OpenD with your Moomoo account.
3. Confirm OpenD is listening on the same port as `MOOMOO_OPEND_PORT`, usually `11111`.
4. Set `.env` to Moomoo simulate mode:

```env
BROKER_PROVIDER=moomoo
BROKER_ENV=SIMULATE
ENABLE_LIVE_TRADING=false
MOOMOO_OPEND_HOST=host.docker.internal
MOOMOO_OPEND_PORT=11111
MOOMOO_OPEND_SSL=false
MOOMOO_OPEND_KEY=
MOOMOO_ACCOUNT_ID_MY=your-my-paper-account-id
MOOMOO_ACCOUNT_ID_US=your-us-paper-account-id
```

Start the app:

```bash
docker compose up
```


List Moomoo accounts detected by OpenD:

```bash
curl http://localhost:3000/broker/moomoo/accounts
```

Use the returned `accID` for `MOOMOO_ACCOUNT_ID_MY` or `MOOMOO_ACCOUNT_ID_US`, matching the account's `trdEnv` and market permissions.

Trigger a paper order test from another terminal:

```bash
curl -X POST http://localhost:3000/broker/paper-order/test \
  -H 'Content-Type: application/json' \
  -d '{"market":"US","symbol":"AAPL","side":"BUY","quantity":1,"limitPrice":1}'
```

For Bursa Malaysia, pass a Moomoo/OpenD-recognized MY stock code, for example:

```bash
curl -X POST http://localhost:3000/broker/paper-order/test \
  -H 'Content-Type: application/json' \
  -d '{"market":"MY","symbol":"1155","side":"BUY","quantity":100,"limitPrice":1}'
```

Paper trading uses `BROKER_ENV=SIMULATE`, so trade unlock password is not required. Live trading uses `BROKER_ENV=REAL` and needs unlock credentials.

## Seeing AI Paper Trades

For Alpaca paper trading with live market snapshots, use:

```env
BROKER_PROVIDER=alpaca
BROKER_ENV=SIMULATE
ENABLE_LIVE_TRADING=false
MARKET_DATA_PROVIDER=alpaca
WATCHLIST_US=AAPL,MSFT,NVDA,TSLA,AMD,META
AI_TRADING_STYLE=active
AI_MIN_CONFIDENCE=0.55
```

Trigger a run immediately:

```bash
curl -X POST http://localhost:3000/trading/run
```

View all latest AI recommendations, risk decisions, and order attempts:

```bash
curl http://localhost:3000/audit/runs/latest
```

View only AI recommendations that planned to trade:

```bash
curl http://localhost:3000/audit/trade-plans
```

If `trade-plans` is empty, the AI still returned `HOLD` for every symbol. Add more symbols to `WATCHLIST_US`, lower `AI_MIN_CONFIDENCE` for paper testing, or inspect `/audit/runs/latest` to see the exact reasons.


## Profit/Loss And Exits

Set default paper TP/SL thresholds:

```env
DEFAULT_TAKE_PROFIT_PERCENT=1.5
DEFAULT_STOP_LOSS_PERCENT=0.75
```

View Alpaca paper account state:

```bash
curl http://localhost:3000/broker/account
```

View current paper positions with unrealized P/L and TP/SL levels:

```bash
curl http://localhost:3000/broker/positions
```

View recent Alpaca orders:

```bash
curl http://localhost:3000/broker/orders
```

Ask the app to check open positions and submit closing orders when TP/SL is hit:

```bash
curl -X POST http://localhost:3000/trading/manage-exits
```


## OpenAI

If `OPENAI_API_KEY` is present, the app calls OpenAI for structured analyst recommendations. If it is empty, the app falls back to a deterministic mock `HOLD` recommendation so local development still works.

## Scheduler

The scheduler runs from `SCHEDULER_CRON`, defaulting to every 20 minutes:

```text
0 */20 * * * *
```

Each run stores scheduler history, AI recommendations, risk decisions, and any approved broker order attempt in Postgres.
