import { Client, Message, TextChannel } from 'discord.js';
import { XPEntry } from '../typings/index';
import { log } from '../utils/logger';
import { XP_CONFIG } from '../config';

const xpMap = new Map<string, XPEntry>();

export function getXPData(): XPEntry[] {
  return Array.from(xpMap.values()).sort((a, b) => b.xp - a.xp);
}

export function getUserXP(userId: string): XPEntry | undefined {
  return xpMap.get(userId);
}

export async function addXP(message: Message): Promise<void> {
  const userId = message.author.id;
  const now = Date.now();

  const current = xpMap.get(userId) ?? { userId, xp: 0, level: 0, lastMessage: 0 };

  if (now - current.lastMessage < XP_CONFIG.cooldownMs) return;

  const newXp = current.xp + XP_CONFIG.perMessage;
  const newLevel = Math.floor(newXp / XP_CONFIG.perLevel);

  xpMap.set(userId, { userId, xp: newXp, level: newLevel, lastMessage: now });

  if (newLevel > current.level) {
    try {
      const channel = message.channel as TextChannel;
      await channel.send(`🎉 ${message.author} leveled up! You are now **Level ${newLevel}**!`);
    } catch (err) {
      log('error', `Failed to send level-up message: ${(err as Error).message}`);
    }
  }
}

export async function awardXPToUser(
  client: Client,
  userId: string,
  channelId: string,
  amount: number
): Promise<void> {
  const current = xpMap.get(userId) ?? { userId, xp: 0, level: 0, lastMessage: 0 };
  const newXp = current.xp + amount;
  const newLevel = Math.floor(newXp / XP_CONFIG.perLevel);

  xpMap.set(userId, { userId, xp: newXp, level: newLevel, lastMessage: current.lastMessage });

  if (newLevel > current.level) {
    try {
      const channel = await client.channels.fetch(channelId) as TextChannel | null;
      const user = await client.users.fetch(userId);
      await channel?.send(`🎉 ${user} leveled up! You are now **Level ${newLevel}**!`);
    } catch (err) {
      log('error', `Failed to send level-up message: ${(err as Error).message}`);
    }
  }
}
