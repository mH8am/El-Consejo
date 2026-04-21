import { EmbedBuilder } from 'discord.js';
import { TrackedPlayer } from '../typings/index';

// ── Base embed factories ──────────────────────────────────────────────────────

export function successEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function errorEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('❌ Error')
    .setDescription(description)
    .setTimestamp();
}

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

// ── LoL rank helpers ──────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, number> = {
  IRON:        0x7c7c7c,
  BRONZE:      0xa05e38,
  SILVER:      0xc0c0c0,
  GOLD:        0xffd700,
  EMERALD:     0x0bc44a,
  PLATINUM:    0x5bbfba,
  DIAMOND:     0x576bde,
  MASTER:      0x9b59b6,
  GRANDMASTER: 0xe74c3c,
  CHALLENGER:  0xf1c40f,
  UNRANKED:    0x99aab5,
};

const TIER_EMOJI: Record<string, string> = {
  IRON:        '⬛',
  BRONZE:      '🟫',
  SILVER:      '⬜',
  GOLD:        '🟨',
  PLATINUM:    '🩵',
  EMERALD:     '🟩',
  DIAMOND:     '💎',
  MASTER:      '🔮',
  GRANDMASTER: '👑',
  CHALLENGER:  '🏆',
  UNRANKED:    '—',
};

export function tierColor(tier: string): number {
  return TIER_COLORS[tier.toUpperCase()] ?? 0x5865f2;
}

export function tierEmoji(tier: string): string {
  return TIER_EMOJI[tier.toUpperCase()] ?? '—';
}

export function rankLabel(tier: string, rank: string): string {
  if (!tier || tier === 'UNRANKED') return 'Unranked';
  const hasDivision = ['IRON','BRONZE','SILVER','GOLD','EMERALD','PLATINUM','DIAMOND'].includes(tier.toUpperCase());
  return hasDivision ? `${tier} ${rank}` : tier;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

const MEDALS = ['🥇', '🥈', '🥉'];
export function medal(index: number): string {
  return MEDALS[index] ?? `**${index + 1}.**`;
}

export function winRate(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return '—';
  return `${((wins / total) * 100).toFixed(1)}%`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ── LP tracker embeds ─────────────────────────────────────────────────────────

export function lpGainEmbed(player: TrackedPlayer, change: number): EmbedBuilder {
  const wr = winRate(player.wins, player.losses);
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`📈 LP Gained — ${tierEmoji(player.tier)} ${player.summonerName}`)
    .setDescription(`> +**${change} LP** after a win`)
    .addFields(
      { name: 'Rank', value: `${tierEmoji(player.tier)} ${rankLabel(player.tier, player.rank)}`, inline: true },
      { name: 'LP', value: `${player.lp} LP`, inline: true },
      { name: 'Win Rate', value: `${wr} (${player.wins}W / ${player.losses}L)`, inline: true }
    )
    .setTimestamp();
}

export function lpLossEmbed(player: TrackedPlayer, change: number): EmbedBuilder {
  const wr = winRate(player.wins, player.losses);
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle(`📉 LP Lost — ${tierEmoji(player.tier)} ${player.summonerName}`)
    .setDescription(`> −**${change} LP** after a loss`)
    .addFields(
      { name: 'Rank', value: `${tierEmoji(player.tier)} ${rankLabel(player.tier, player.rank)}`, inline: true },
      { name: 'LP', value: `${player.lp} LP`, inline: true },
      { name: 'Win Rate', value: `${wr} (${player.wins}W / ${player.losses}L)`, inline: true }
    )
    .setTimestamp();
}
