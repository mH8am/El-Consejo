import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getXPData } from '../../../services/xpService';
import { getTrackedPlayers } from '../../../services/lpTracker';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Show the server leaderboard')
  .addStringOption((opt) =>
    opt
      .setName('type')
      .setDescription('Leaderboard type')
      .setRequired(true)
      .addChoices(
        { name: 'XP', value: 'xp' },
        { name: 'LoL Wins', value: 'lol' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const type = interaction.options.getString('type', true);

  if (type === 'xp') {
    const data = getXPData().slice(0, 10);
    if (data.length === 0) {
      await interaction.reply({ content: '📭 No XP data yet — start chatting!', ephemeral: true });
      return;
    }
    const description = data
      .map((e, i) => `**${i + 1}.** <@${e.userId}> — Level **${e.level}** (${e.xp} XP)`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏅 XP Leaderboard')
      .setDescription(description)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else {
    const players = getTrackedPlayers().sort((a, b) => b.wins - a.wins).slice(0, 10);
    if (players.length === 0) {
      await interaction.reply({ content: '📭 No tracked LoL players yet.', ephemeral: true });
      return;
    }
    const description = players
      .map((p, i) => `**${i + 1}.** ${p.summonerName} — ${p.wins} wins (${p.tier} ${p.rank})`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏆 LoL Wins Leaderboard')
      .setDescription(description)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}
