import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getTrackedPlayers } from '../../../services/lpTracker';

export const data = new SlashCommandBuilder()
  .setName('tracked')
  .setDescription('Show all players currently being tracked for LP changes');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const players = getTrackedPlayers();

  if (players.length === 0) {
    await interaction.reply({
      content: '📭 No players are being tracked yet. Use `/addplayer` or the **📡 Track Player** button on a `/profile`.',
      ephemeral: true,
    });
    return;
  }

  const description = players
    .map((p, i) => {
      const rank = p.tier === 'UNRANKED' ? 'Unranked' : `${p.tier} ${p.rank} — ${p.lp} LP`;
      const wr =
        p.wins + p.losses > 0
          ? `${((p.wins / (p.wins + p.losses)) * 100).toFixed(1)}% WR`
          : 'No games';
      return `**${i + 1}.** ${p.summonerName}\n┣ ${rank}\n┗ ${p.wins}W / ${p.losses}L · ${wr}`;
    })
    .join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📡 Tracked Players (${players.length})`)
    .setDescription(description)
    .setFooter({ text: `LP updates every ${process.env.POLL_INTERVAL_MINUTES ?? 5} minutes` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
