# ⚔️ El Consejo — Discord Bot

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)
![Discord.js](https://img.shields.io/badge/discord.js-v15+-5865F2?logo=discord&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![Riot API](https://img.shields.io/badge/Riot%20Games%20API-v4-D0021B?logo=riot-games&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-≥18.x-339933?logo=node.js&logoColor=white)

**El Consejo** is a multi-purpose Discord bot built with **TypeScript**, **discord.js**, and an optional **Express.js** API layer. It handles server moderation, engagement, utilities, and deep **League of Legends** integration — all through polished slash commands and rich Discord embeds.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Discord Bot Setup](#-discord-bot-setup)
- [Riot API Setup](#-riot-api-setup)
- [Running the Bot](#-running-the-bot)
- [Slash Commands Reference](#-slash-commands-reference)
- [Module: League of Legends Tracker](#-module-league-of-legends-tracker)
- [Module: Moderation](#-module-moderation)
- [Module: Server Utilities](#-module-server-utilities)
- [Module: Fun & Engagement](#-module-fun--engagement)
- [Module: Express API Layer](#-module-express-api-layer)
- [Adding a New Command](#-adding-a-new-command)
- [Adding a New API Route](#-adding-a-new-api-route)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

### ⚔️ League of Legends Tracker
- View real-time **Challenger / Grandmaster** ranked ladders
- Look up any summoner's **ranked profile** (tier, LP, win rate, hot streak)
- **Track players** — automatically posts to a channel when LP is gained or lost
- Color-coded embeds: 📈 green for gains, 📉 red for losses

### 🛡️ Moderation
- Kick, ban, mute, and warn members via slash commands
- All actions logged to a dedicated moderation channel with full context
- Member verification system for new server joins

### 🔧 Server Utilities
- Welcome & farewell messages with custom embeds
- Reaction roles and role menus
- Polls, reminders, and server/user info commands

### 🎉 Fun & Engagement
- XP & leveling system — earn XP by chatting
- Server activity leaderboard
- Giveaway system with automatic winner drawing
- Trivia mini-game

### 🌐 Express API Layer *(optional)*
- Internal REST API running alongside the bot in the same Node.js process
- `GET /health` — health check endpoint for hosting platforms
- `GET /api/players` — returns currently tracked LoL players
- `GET /api/stats` — returns server stats snapshot
- Easily extensible with new routes as the bot grows

---

## 🧰 Tech Stack

| Purpose | Technology |
|---------|-----------|
| Language | TypeScript 5.x |
| Discord library | discord.js v15+ |
| API framework | Express.js v5+ |
| HTTP requests | Axios |
| Environment variables | dotenv |
| Runtime | Node.js ≥ 18.x |
| Dev tooling | ts-node, nodemon |
| Type definitions | @types/node, @types/express |

---

## 🗂️ Project Structure

```
el-consejo/
├── src/
│   ├── bot/
│   │   ├── commands/
│   │   │   ├── lol/
│   │   │   │   ├── ladder.ts        # /lol ladder
│   │   │   │   ├── profile.ts       # /lol profile
│   │   │   │   └── addplayer.ts     # /lol addplayer
│   │   │   ├── moderation/
│   │   │   │   ├── kick.ts          # /mod kick
│   │   │   │   ├── ban.ts           # /mod ban
│   │   │   │   ├── mute.ts          # /mod mute
│   │   │   │   └── warn.ts          # /mod warn
│   │   │   ├── utility/
│   │   │   │   ├── poll.ts          # /poll
│   │   │   │   ├── remind.ts        # /remind
│   │   │   │   ├── serverinfo.ts    # /serverinfo
│   │   │   │   └── userinfo.ts      # /userinfo
│   │   │   └── fun/
│   │   │       ├── leaderboard.ts   # /leaderboard
│   │   │       ├── giveaway.ts      # /giveaway
│   │   │       └── trivia.ts        # /trivia
│   │   ├── events/
│   │   │   ├── ready.ts             # Bot ready — starts LP tracker & API
│   │   │   ├── interactionCreate.ts # Routes all slash command interactions
│   │   │   ├── guildMemberAdd.ts    # Welcome messages & verification
│   │   │   ├── guildMemberRemove.ts # Farewell messages
│   │   │   └── messageCreate.ts     # XP tracking, auto-mod
│   │   ├── structures/
│   │   │   └── CustomClient.ts      # Extended Client with commands collection
│   │   └── client.ts                # Initializes and exports the bot client
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.ts            # GET /health
│   │   │   ├── players.ts           # GET /api/players
│   │   │   └── stats.ts             # GET /api/stats
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts      # Global Express error handler
│   │   │   └── apiKeyAuth.ts        # Optional API key guard middleware
│   │   └── server.ts                # Express app setup & route registration
│   │
│   ├── services/
│   │   ├── riotApi.ts               # All Riot Games API calls
│   │   ├── lpTracker.ts             # LP polling engine & change detection
│   │   ├── modLogger.ts             # Moderation action logger
│   │   └── xpService.ts             # XP & leveling logic
│   │
│   ├── utils/
│   │   ├── embeds.ts                # Reusable Discord embed builders
│   │   ├── permissions.ts           # Discord permission guard helpers
│   │   └── logger.ts                # Shared console logging utility
│   │
│   ├── typings/
│   │   └── index.d.ts               # Shared TypeScript types & interfaces
│   │
│   ├── deploy-commands.ts           # One-time slash command registration
│   └── index.ts                     # App entry point — starts bot + API
│
├── .env                             # Secret environment variables (DO NOT COMMIT)
├── .env.example                     # Safe environment variable template
├── .gitignore
├── tsconfig.json
├── package.json
└── INSTRUCTIONS.md
```

---

## ✅ Prerequisites

| Tool | Minimum Version | Download |
|------|----------------|----------|
| Node.js | `>= 18.x` | [nodejs.org](https://nodejs.org) |
| npm | `>= 9.x` | Comes with Node.js |
| Git | Any | [git-scm.com](https://git-scm.com) |

You will also need:
- A **Discord account** with access to the [Discord Developer Portal](https://discord.com/developers/applications)
- A **Riot Games account** with access to the [Riot Developer Portal](https://developer.riotgames.com) *(for LoL features)*

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/el-consejo.git
cd el-consejo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Copy the environment file

```bash
cp .env.example .env
```

Fill in your values — see [Configuration](#-configuration) below.

---

## ⚙️ Configuration

All configuration lives in your `.env` file. Never commit this file.

```env name=.env.example
# ─── Discord ──────────────────────────────────────────────────────────────────
# Your bot token from the Discord Developer Portal
DISCORD_TOKEN=your_discord_bot_token_here

# Your Discord Application's Client ID
CLIENT_ID=your_discord_client_id_here

# ─── Channel IDs ──────────────────────────────────────────────────────────────
# Channel where LP gain/loss updates are posted
LP_CHANNEL_ID=your_lp_updates_channel_id_here

# Channel where moderation actions are logged
MOD_LOG_CHANNEL_ID=your_mod_log_channel_id_here

# Channel where welcome and farewell messages are sent
WELCOME_CHANNEL_ID=your_welcome_channel_id_here

# ─── Riot Games ───────────────────────────────────────────────────────────────
# API key from developer.riotgames.com (dev keys expire every 24h)
RIOT_API_KEY=your_riot_api_key_here

# Your server's region (na1, euw1, kr, eun1, br1, jp1, la1, la2, oc1)
REGION=na1

# ─── Bot Settings ─────────────────────────────────────────────────────────────
# How often (in minutes) the LP tracker polls the Riot API — default: 5
POLL_INTERVAL_MINUTES=5

# Environment: development | production
NODE_ENV=development

# ─── Express API (optional) ───────────────────────────────────────────────────
# Port the Express API listens on — default: 4000
API_PORT=4000

# Optional secret key to protect API endpoints
API_SECRET_KEY=your_api_secret_key_here
```

> ⚠️ **NEVER commit your `.env` file.** Your bot token is a secret — treat it like a password.

---

## 🎮 Discord Bot Setup

### 1. Create a Discord Application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **"New Application"** and name it **El Consejo**
3. Navigate to **"Bot"** on the left sidebar
4. Click **"Add Bot"** and confirm

### 2. Get Your Bot Token

1. Under **"Bot"**, click **"Reset Token"**
2. Copy it and paste it as `DISCORD_TOKEN` in your `.env`

### 3. Enable Required Intents

Under **"Bot" → "Privileged Gateway Intents"**, enable:
- ✅ `GUILD MEMBERS INTENT` — needed for welcome/farewell messages
- ✅ `MESSAGE CONTENT INTENT` — needed for XP tracking and auto-mod

### 4. Invite the Bot to Your Server

1. Go to **"OAuth2" → "URL Generator"**
2. **Scopes:** `bot` + `applications.commands`
3. **Bot Permissions:**
   - ✅ Send Messages, Embed Links, Manage Messages
   - ✅ Kick Members, Ban Members, Moderate Members
   - ✅ Read Message History, Add Reactions
   - ✅ Use Slash Commands
4. Open the generated URL → add the bot to your server

### 5. Get Your IDs

- **Client ID** → **"OAuth2" → "General"**
- **Channel IDs** → Enable **Developer Mode** in Discord (`Settings → Advanced → Developer Mode`) → right-click any channel → **"Copy Channel ID"**

---

## 🔑 Riot API Setup

1. Sign in at [developer.riotgames.com](https://developer.riotgames.com)
2. Copy your **Development API Key** → paste as `RIOT_API_KEY` in `.env`

> ⏳ Dev keys expire every **24 hours**. Apply for a **Production Key** for permanent use.

### Supported Regions

| Code | Server | Code | Server |
|------|--------|------|--------|
| `na1` | North America | `kr` | Korea |
| `euw1` | Europe West | `jp1` | Japan |
| `eun1` | EU Nordic & East | `br1` | Brazil |
| `oc1` | Oceania | `la1` / `la2` | Latin America |

---

## ▶️ Running the Bot

### Step 1 — Register Slash Commands
> Run once, or any time you add or modify commands.

```bash
npm run deploy
```

### Step 2 — Start in Development (with hot-reload)

```bash
npm run dev
```

### Step 3 — Build & Run for Production

```bash
npm run build
npm start
```

### `package.json` Scripts

```json name=package.json
{
  "scripts": {
    "dev": "nodemon --watch src --ext ts --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "deploy": "ts-node src/deploy-commands.ts"
  }
}
```

---

## 💬 Slash Commands Reference

### ⚔️ League of Legends

| Command | Options | Description |
|---------|---------|-------------|
| `/lol ladder` | `tier`: Challenger \| Grandmaster | Top 10 players with LP, wins, and losses |
| `/lol profile` | `name`: summoner name | Full ranked profile — tier, LP, win rate, hot streak |
| `/lol addplayer` | `name`: summoner name | Add a summoner to the active LP tracker |

### 🛡️ Moderation

| Command | Options | Description |
|---------|---------|-------------|
| `/mod kick` | `user`, `reason` | Kick a member from the server |
| `/mod ban` | `user`, `reason`, `days` | Ban a member and optionally delete recent messages |
| `/mod mute` | `user`, `duration`, `reason` | Timeout a member for a set duration |
| `/mod warn` | `user`, `reason` | Issue a formal warning logged to the mod channel |

### 🔧 Utility

| Command | Options | Description |
|---------|---------|-------------|
| `/poll` | `question`, `options` | Create a reaction-based poll |
| `/remind` | `time`, `message` | Set a personal reminder |
| `/serverinfo` | — | Display server stats and information |
| `/userinfo` | `user` *(optional)* | Display a user's profile, roles, and join date |

### 🎉 Fun & Engagement

| Command | Options | Description |
|---------|---------|-------------|
| `/leaderboard` | `type`: XP \| LoL Wins | Server activity or LoL win leaderboard |
| `/giveaway` | `prize`, `duration`, `winners` | Start a giveaway with auto-drawing |
| `/trivia` | `category` *(optional)* | Answer a trivia question |

---

## 📡 Module: League of Legends Tracker

### How It Works

1. Use `/lol addplayer <name>` — current LP is saved as baseline
2. Every `POLL_INTERVAL_MINUTES` minutes, the bot polls the Riot API for each tracked player
3. If LP has changed, an embed is posted to `LP_CHANNEL_ID`:
   - 📈 **Green embed** — LP gained
   - 📉 **Red embed** — LP lost
4. Embed includes: summoner name, LP change, current tier + rank + LP, and win/loss record

### Embed Preview

```
┌─────────────────────────────────────┐
│ 📈 LP Update — Faker                │
├─────────────────────────────────────┤
│ ✅ Gained LP     +18 LP             │
│ 📊 Current LP    Challenger — 1204  │
│ 🏆 Win/Loss      312W / 201L        │
└─────────────────────────────────────┘
```

### ⚠️ Data Persistence

Tracked players are stored **in memory** by default and reset on restart.
For production, replace the `Map` in `lpTracker.ts` with a database:

| Database | Library | Notes |
|----------|---------|-------|
| SQLite | `better-sqlite3` | Simple, no server, great for small bots |
| PostgreSQL | `pg` + `drizzle-orm` | Scalable, production-ready |
| MongoDB | `mongoose` | Flexible document storage |

---

## 🛡️ Module: Moderation

- All moderation actions logged to `MOD_LOG_CHANNEL_ID` with timestamp, moderator, target, reason, and action type
- Discord permission checks enforced before every action
- Permission logic lives in `src/utils/permissions.ts`

---

## 🔧 Module: Server Utilities

- **Welcome / farewell** messages fire on `guildMemberAdd` / `guildMemberRemove`
- **Polls** use reaction-based voting with emoji options
- **Reminders** stored in memory and fired via `setTimeout`

---

## 🎉 Module: Fun & Engagement

- **XP System** — members earn XP per message (per-user cooldown prevents spam farming). Logic in `src/services/xpService.ts`
- **Leaderboard** — paginated embed sorted by XP or LoL wins
- **Giveaways** — entries via button interactions; winner randomly drawn on expiry
- **Trivia** — question with button answers; correct answer awards XP

---

## 🌐 Module: Express API Layer

The bot optionally runs an **Express.js REST API** in the same Node.js process.
This is useful for health checks, webhooks, or exposing bot data to external tools.

### Why Express Alongside discord.js?

Both discord.js and Express are just Node.js — they run together from a single entry point with no conflict:

```typescript name=src/index.ts
import 'dotenv/config';
import { client } from './bot/client.js';
import { startApi } from './api/server.js';
import { startLPTracker } from './services/lpTracker.js';

// Start Express API
startApi();

// Start Discord bot
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);
  startLPTracker(client);
});

client.login(process.env.DISCORD_TOKEN);
```

### Express Server Setup

```typescript name=src/api/server.ts
import express, { Request, Response, NextFunction } from 'express';
import healthRouter from './routes/health.js';
import playersRouter from './routes/players.js';
import statsRouter from './routes/stats.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/api/players', playersRouter);
app.use('/api/stats', statsRouter);

// Global error handler — always last
app.use(errorHandler);

export function startApi(): void {
  const port = process.env.API_PORT || 4000;
  app.listen(port, () => console.log(`🌐 API running on :${port}`));
}
```

### API Routes

#### `GET /health`
Returns bot status. Used by hosting platforms to verify the process is alive.

```typescript name=src/api/routes/health.ts
import { Router } from 'express';
import { client } from '../../bot/client.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    bot: client.isReady() ? 'online' : 'offline',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
```

#### `GET /api/players`
Returns all currently tracked LoL players and their last known LP.

```typescript name=src/api/routes/players.ts
import { Router } from 'express';
import { getTrackedPlayers } from '../../services/lpTracker.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';

const router = Router();

router.get('/', apiKeyAuth, (req, res) => {
  res.json(getTrackedPlayers());
});

export default router;
```

#### `GET /api/stats`
Returns a snapshot of server stats.

```typescript name=src/api/routes/stats.ts
import { Router } from 'express';
import { client } from '../../bot/client.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';

const router = Router();

router.get('/', apiKeyAuth, (req, res) => {
  const guild = client.guilds.cache.first();
  res.json({
    guildName: guild?.name ?? 'Unknown',
    memberCount: guild?.memberCount ?? 0,
    botUptime: process.uptime(),
  });
});

export default router;
```

### Middleware

#### API Key Guard
Protects sensitive routes — callers must pass the `x-api-key` header.

```typescript name=src/api/middleware/apiKeyAuth.ts
import { Request, Response, NextFunction } from 'express';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key'];
  if (!process.env.API_SECRET_KEY || key === process.env.API_SECRET_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
```

#### Global Error Handler

```typescript name=src/api/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error(`[API Error] ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
}
```

### Available Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | None | Bot health check — status, uptime |
| `GET` | `/api/players` | API Key | List all tracked LoL players |
| `GET` | `/api/stats` | API Key | Server name, member count, uptime |

> To call a protected endpoint, include the header: `x-api-key: your_api_secret_key_here`

---

## ➕ Adding a New Command

1. Create a new file in `src/bot/commands/<category>/`
2. Export a `data` object (SlashCommandBuilder) and an `execute` function
3. The bot auto-loads all commands on startup — no manual registration needed in `index.ts`
4. Re-run `npm run deploy` to register the new slash command with Discord

```typescript name=src/bot/commands/category/mycommand.ts
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('mycommand')
  .setDescription('What this command does');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.reply({ content: '✅ Done!', ephemeral: true });
}
```

---

## ➕ Adding a New API Route

1. Create a new file in `src/api/routes/`
2. Export an Express `Router`
3. Register it in `src/api/server.ts`

```typescript name=src/api/routes/myroute.ts
import { Router } from 'express';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';

const router = Router();

router.get('/', apiKeyAuth, (req, res) => {
  res.json({ message: 'Hello from my new route!' });
});

export default router;
```

Then register it in `server.ts`:

```typescript
import myRouter from './routes/myroute.js';
app.use('/api/myroute', myRouter);
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(lol): add /lol removeplayer command
   feat(api): add GET /api/modlogs route
   fix(mod): handle missing reason in /mod warn
   chore: update discord.js to latest
   ```
4. **Open a Pull Request** against `main`

### Code Style Rules

- ✅ TypeScript strict mode — zero `any` types
- ✅ `async/await` — no raw `.then()` chains
- ✅ `try/catch` on every external API call
- ✅ Ephemeral replies for all bot errors
- ✅ All Riot API calls in `src/services/riotApi.ts`
- ✅ All embed builders in `src/utils/embeds.ts`
- ✅ All Express routes in `src/api/routes/`
- ✅ One command per file, one file per command
- ✅ Never hardcode tokens, IDs, or secrets — always use `.env`

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|---------|
| `Error: Invalid token` | Check `DISCORD_TOKEN` in `.env` — no quotes or extra spaces |
| `403 Forbidden` from Riot API | Dev key expired — regenerate at [developer.riotgames.com](https://developer.riotgames.com) |
| Slash commands not appearing | Run `npm run deploy`. Global commands take up to **1 hour** to propagate |
| Commands appear but bot doesn't respond | Ensure `applications.commands` scope was used when inviting the bot |
| LP tracker not posting | Verify `LP_CHANNEL_ID` and bot has **Send Messages** + **Embed Links** in that channel |
| Welcome messages not sending | Check `WELCOME_CHANNEL_ID` and confirm `GUILD MEMBERS INTENT` is enabled |
| XP not being tracked | Confirm `MESSAGE CONTENT INTENT` is enabled in the Developer Portal |
| `GET /health` returns 404 | Ensure `startApi()` is called in `index.ts` and `API_PORT` is set in `.env` |
| API returns 401 Unauthorized | Pass `x-api-key: your_api_secret_key_here` header in your request |
| Hot-reload not working | Make sure `nodemon` and `ts-node` are installed as dev dependencies |

---

## 📄 License

This project is licensed under the **MIT License** — see `LICENSE` for details.

---

> **El Consejo** is an independent project not affiliated with, endorsed by, or officially connected to Discord Inc. or Riot Games.