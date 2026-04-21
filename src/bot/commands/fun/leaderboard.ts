import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getXPData } from '../../../services/xpService';
import { getTrackedPlayers } from '../../../services/lpTracker';
import { medal, tierEmoji, rankLabel, winRate } from '../../../utils/embeds';
import { XP_CONFIG } from '../../../config';

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
    const entries = getXPData().slice(0, 10);

    if (entries.length === 0) {
      const empty = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('🏅 XP Leaderboard')
        .setDescription('No XP data yet — start chatting to earn XP!')
        .setTimestamp();
      await interaction.reply({ embeds: [empty], ephemeral: true });
      return;
    }

    const description = entries
      .map((e, i) => {
        const xpToNext = XP_CONFIG.perLevel - (e.xp % XP_CONFIG.perLevel);
        const suffix = i === 0 ? ' 👑' : '';
        return `${medal(i)} <@${e.userId}>${suffix}\n┣ Level **${e.level}** · ${e.xp.toLocaleString()} XP\n┗ ${xpToNext} XP to next level`;
      })
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏅 XP Leaderboard')
      .setDescription(description)
      .setFooter({ text: `${XP_CONFIG.perMessage} XP per message · ${XP_CONFIG.perLevel} XP per level` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } else {
    const players = getTrackedPlayers().sort((a, b) => b.wins - a.wins).slice(0, 10);

    if (players.length === 0) {
      const empty = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('🏆 LoL Wins Leaderboard')
        .setDescription('No tracked LoL players yet.\nUse `/addplayer` to start tracking.')
        .setTimestamp();
      await interaction.reply({ embeds: [empty], ephemeral: true });
      return;
    }

    const description = players
      .map((p, i) => {
        const wr = winRate(p.wins, p.losses);
        const suffix = i === 0 ? ' 👑' : '';
        return `${medal(i)} **${p.summonerName}**${suffix}\n┣ ${tierEmoji(p.tier)} ${rankLabel(p.tier, p.rank)}\n┗ ${p.wins}W / ${p.losses}L · ${wr} WR`;
      })
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏆 LoL Wins Leaderboard')
      .setDescription(description)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}
