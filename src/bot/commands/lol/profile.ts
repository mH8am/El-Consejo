import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getFullProfile } from '../../../services/riotApi';
import { errorEmbed } from '../../../utils/embeds';
import { addTrackedPlayer, getTrackedPlayers } from '../../../services/lpTracker';

export const cooldown = 10;

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Look up a summoner\'s ranked profile')
  .addStringOption((opt) =>
    opt.setName('name').setDescription('Riot ID — GameName#Tag (e.g. Faker#KR1)').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const name = interaction.options.getString('name', true);

  if (!name.includes('#')) {
    await interaction.editReply({
      embeds: [errorEmbed('Please use **Riot ID** format: `GameName#Tag` (e.g. `Faker#KR1`).')],
    });
    return;
  }

  const profile = await getFullProfile(name);

  if (!profile) {
    await interaction.editReply({
      embeds: [errorEmbed(`Could not find account **${name}**. Make sure the Riot ID is correct.`)],
    });
    return;
  }

  const isUnranked = profile.tier === 'UNRANKED';
  const winRate = profile.wins + profile.losses > 0
    ? ((profile.wins / (profile.wins + profile.losses)) * 100).toFixed(1)
    : '0.0';

  const embed = new EmbedBuilder()
    .setColor(isUnranked ? 0x99aab5 : 0x5865f2)
    .setTitle(`🎮 ${profile.summonerName}`)
    .addFields(
      { name: '🏆 Rank', value: isUnranked ? 'Unranked' : `${profile.tier} ${profile.rank}`, inline: true },
      { name: '📊 LP', value: isUnranked ? '—' : `${profile.lp} LP`, inline: true },
      { name: '📈 Win Rate', value: isUnranked ? '—' : `${winRate}%`, inline: true },
      { name: '✅ Wins', value: isUnranked ? '—' : `${profile.wins}`, inline: true },
      { name: '❌ Losses', value: isUnranked ? '—' : `${profile.losses}`, inline: true },
      { name: '⚡ Level', value: `${profile.summonerLevel}`, inline: true }
    )
    .setFooter({ text: `Region: ${process.env.REGION ?? 'na1'}` })
    .setTimestamp();

  const alreadyTracked = getTrackedPlayers().some(
    (p) => p.summonerName.toLowerCase() === profile.summonerName.toLowerCase()
  );

  const trackButton = new ButtonBuilder()
    .setCustomId(`track_${profile.summonerName}`)
    .setLabel(alreadyTracked ? '✅ Already Tracking' : '📡 Track Player')
    .setStyle(alreadyTracked ? ButtonStyle.Secondary : ButtonStyle.Primary)
    .setDisabled(alreadyTracked);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(trackButton);

  await interaction.editReply({ embeds: [embed], components: [row] });
}
