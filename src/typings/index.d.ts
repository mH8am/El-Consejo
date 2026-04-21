import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  cooldown?: number;
  category?: string;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}

export interface TrackedPlayer {
  summonerName: string;
  puuid: string;
  summonerLevel: number;
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
}

export interface RiotRankedEntry {
  summonerId: string;
  summonerName: string;
  puuid?: string;
  leaguePoints: number;
  rank: string;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
  tier?: string;
  queueType?: string;
  leagueId?: string;
}

export interface LadderEntry extends RiotRankedEntry {
  tier: string;
  displayName: string;
}

export interface XPEntry {
  userId: string;
  xp: number;
  level: number;
  lastMessage: number;
}

export interface GiveawayEntry {
  messageId: string;
  channelId: string;
  prize: string;
  winners: number;
  endsAt: number;
  entries: string[];
}
