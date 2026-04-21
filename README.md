# El Consejo — Discord Bot

A feature-rich Discord bot built with **TypeScript** and **discord.js v14**, combining League of Legends live tracking, server moderation, XP-based leveling, and an optional REST API.

---

## Features

### League of Legends
- **LP Tracker** — polls Riot API at a configurable interval and posts LP gain/loss embeds to a dedicated channel
- **Profile lookup** — full ranked stats (tier, rank, LP, win/loss, summoner level) via Riot ID (`GameName#Tag`)
- **Challenger / Grandmaster ladder** — top 10 players for any tracked tier

### Moderation
- Kick, ban, timeout (mute), and warn commands
- Every action logged to a configurable mod-log channel with moderator, target, reason, and timestamp

### Server Utilities
- Poll system with emoji reactions
- Personal reminders
- Server info and user info embeds
- Welcome / farewell messages on member join/leave

### Engagement & Fun
- **XP System** — 15 XP per message (60-second cooldown), automatic level-up announcements
- **Leaderboard** — top 10 members by XP or LoL wins
- **Giveaway** — button-based entry with auto-draw
- **Trivia** — multiple-choice questions with button answers

### REST API (optional)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Bot status and uptime |
| GET | `/api/players` | `x-api-key` | Tracked LoL players |
| GET | `/api/stats` | `x-api-key` | Guild name, member count, uptime |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.x |
| Discord library | discord.js v14 |
| API framework | Express.js v4 |
| Riot API client | Axios |
| Config | dotenv |
| Dev tooling | ts-node, nodemon |

---

## Prerequisites

- **Node.js** >= 18
- A **Discord application** with bot token ([Discord Developer Portal](https://discord.com/developers/applications))
- A **Riot Games API key** ([developer.riotgames.com](https://developer.riotgames.com)) — development keys expire every 24 hours
- Discord **Developer Mode** enabled to copy channel IDs

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd "El Consejo"
npm install
```

### 2. Configure environment

Copy the example below into a `.env` file at the project root and fill in your values:

```env
# Discord
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here

# Channel IDs (right-click a channel → Copy ID)
LP_CHANNEL_ID=channel_id_for_lp_updates
MOD_LOG_CHANNEL_ID=channel_id_for_mod_logs
WELCOME_CHANNEL_ID=channel_id_for_welcome_messages

# Riot Games
RIOT_API_KEY=RGAPI-your-key-here
REGION=euw1   # euw1 | na1 | kr | br1 | la1 | la2 | oc1 | ru | tr1 | jp1

# Bot Settings
POLL_INTERVAL_MINUTES=5
NODE_ENV=development

# Express API
API_PORT=4000
API_SECRET_KEY=your_secret_api_key
```

### 3. Register slash commands

This step is required once (and any time you add or rename commands):

```bash
npm run deploy
```

### 4. Start the bot

```bash
# Development (hot-reload)
npm run dev

# Production
npm run build
npm start
```

---

## Slash Commands

### League of Legends

| Command | Description |
|---------|-------------|
| `/lol profile <name#tag>` | Show ranked profile for a summoner |
| `/lol ladder <tier>` | Top 10 Challenger or Grandmaster players |
| `/lol addplayer <name#tag>` | Add a player to the LP tracker |
| `/lol tracked` | List all currently tracked players |

### Moderation

| Command | Description |
|---------|-------------|
| `/mod kick <user> [reason]` | Kick a member |
| `/mod ban <user> [reason] [days]` | Ban a member |
| `/mod mute <user> <duration> [reason]` | Timeout a member |
| `/mod warn <user> <reason>` | Issue a warning |

### Utilities

| Command | Description |
|---------|-------------|
| `/serverinfo` | Guild statistics |
| `/userinfo [user]` | User profile and roles |
| `/poll <question> <options>` | Create a reaction poll |
| `/remind <time> <message>` | Set a personal reminder |

### Fun

| Command | Description |
|---------|-------------|
| `/leaderboard [type]` | Top 10 by XP or LoL wins |
| `/giveaway <prize> <duration> <winners>` | Start a giveaway |
| `/trivia [category]` | Start a trivia question |

---

## Project Structure

```
src/
├── bot/
│   ├── commands/
│   │   ├── lol/          # League of Legends commands
│   │   ├── moderation/   # Kick, ban, mute, warn
│   │   ├── utility/      # Poll, remind, serverinfo, userinfo
│   │   └── fun/          # Leaderboard, giveaway, trivia
│   ├── events/           # Discord event handlers
│   └── structures/       # Custom client class
├── api/
│   ├── routes/           # Express route handlers
│   └── middleware/       # Error handler, API key auth
├── services/
│   ├── riotApi.ts        # Riot Games API wrapper
│   ├── lpTracker.ts      # LP polling engine
│   ├── xpService.ts      # XP and leveling logic
│   └── modLogger.ts      # Moderation action logger
├── utils/
│   ├── embeds.ts         # Reusable embed builders
│   ├── loader.ts         # Dynamic command loader
│   ├── permissions.ts    # Permission helpers
│   └── logger.ts         # Timestamped logger
├── deploy-commands.ts    # Slash command registration
└── index.ts              # Entry point
```

---

## Adding a New Command

1. Create a file under the appropriate `src/bot/commands/<category>/` folder.
2. Export a `data` (SlashCommandBuilder) and an `execute` function — the loader picks it up automatically.
3. Run `npm run deploy` to register it with Discord.

```ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply('Pong!');
}
```

---

## Notes

- **In-memory storage** — XP, LP tracking data, and reminders reset on restart. For persistence across restarts, integrate a database (e.g., SQLite, MongoDB, PostgreSQL).
- **Riot API rate limits** — development keys have strict limits; use a personal or production key for heavier polling intervals.
- **Bot permissions** — the bot requires `KICK_MEMBERS`, `BAN_MEMBERS`, `MODERATE_MEMBERS`, `SEND_MESSAGES`, `EMBED_LINKS`, and `READ_MESSAGE_HISTORY` in the target server.

---

## License

MIT
