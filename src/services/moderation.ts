export interface WarnRecord {
  moderatorTag: string;
  reason: string;
  timestamp: number;
}

// warnStore[guildId][userId] = WarnRecord[]
const warnStore = new Map<string, Map<string, WarnRecord[]>>();

export function addWarn(guildId: string, userId: string, record: WarnRecord): WarnRecord[] {
  if (!warnStore.has(guildId)) warnStore.set(guildId, new Map());
  const guild = warnStore.get(guildId)!;
  const existing = guild.get(userId) ?? [];
  const updated = [...existing, record];
  guild.set(userId, updated);
  return updated;
}

export function getWarns(guildId: string, userId: string): WarnRecord[] {
  return warnStore.get(guildId)?.get(userId) ?? [];
}

export function clearWarns(guildId: string, userId: string): void {
  warnStore.get(guildId)?.delete(userId);
}
