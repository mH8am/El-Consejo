import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getTrackedPlayers } from '../../../services/lpTracker';
import { tierEmoji, rankLabel, winRate } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('tracked')
  .setDescription('Show all players currently being tracked for LP changes');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const players = getTrackedPlayers();

  if (players.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📡 LP Tracker')
      .setDescription(
        'No players are being tracked yet.\n\n' +
        'Use `/addplayer` or the **Track Player** button on any `/profile` to get started.'
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  const description = players
    .map((p, i) => {
      const rank = `${tierEmoji(p.tier)} ${rankLabel(p.tier, p.rank)} — ${p.lp} LP`;
      const wr = winRate(p.wins, p.losses);
      return `**${i + 1}.** **${p.summonerName}**\n┣ ${rank}\n┗ ${p.wins}W / ${p.losses}L · ${wr} WR`;
    })
    .join('\n\n');

  const interval = process.env.POLL_INTERVAL_MINUTES ?? '5';

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📡 Tracked Players — ${players.length}`)
    .setDescription(description)
    .setFooter({ text: `Polling every ${interval} minute${interval !== '1' ? 's' : ''}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
