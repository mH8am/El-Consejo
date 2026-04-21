import { Command } from '../typings/index';

// cooldowns[commandName][userId] = timestamp when cooldown expires
const cooldowns = new Map<string, Map<string, number>>();

export function checkCooldown(userId: string, command: Command): number {
  const cooldownSec = command.cooldown ?? 0;
  if (cooldownSec <= 0) return 0;

  const name = (command.data as { name: string }).name;
  if (!cooldowns.has(name)) cooldowns.set(name, new Map());

  const userCooldowns = cooldowns.get(name)!;
  const expiresAt = userCooldowns.get(userId) ?? 0;
  const now = Date.now();

  if (now < expiresAt) {
    return Math.ceil((expiresAt - now) / 1000);
  }

  userCooldowns.set(userId, now + cooldownSec * 1000);
  return 0;
}
