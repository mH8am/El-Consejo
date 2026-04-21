import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getFullProfile } from '../../../services/riotApi';
import { errorEmbed, tierColor, tierEmoji, rankLabel, winRate } from '../../../utils/embeds';
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
      embeds: [errorEmbed(`Could not find account **${name}**.\nDouble-check the Riot ID and region.`)],
    });
    return;
  }

  const isUnranked = profile.tier === 'UNRANKED';
  const wr = winRate(profile.wins, profile.losses);
  const totalGames = profile.wins + profile.losses;
  const region = (process.env.REGION ?? 'na1').toUpperCase();

  const embed = new EmbedBuilder()
    .setColor(tierColor(profile.tier))
    .setAuthor({ name: region, iconURL: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-league-of-legends/global/default/assets/images/ranked-mini-crests/silver.png' })
    .setTitle(`${tierEmoji(profile.tier)}  ${profile.summonerName}`)
    .addFields(
      {
        name: 'Rank',
        value: isUnranked ? '`Unranked`' : `\`${rankLabel(profile.tier, profile.rank)}\``,
        inline: true,
      },
      {
        name: 'LP',
        value: isUnranked ? '`—`' : `\`${profile.lp} LP\``,
        inline: true,
      },
      {
        name: 'Summoner Level',
        value: `\`${profile.summonerLevel}\``,
        inline: true,
      },
      {
        name: 'Win Rate',
        value: isUnranked ? '`—`' : `\`${wr}\``,
        inline: true,
      },
      {
        name: 'Wins',
        value: isUnranked ? '`—`' : `\`${profile.wins}W\``,
        inline: true,
      },
      {
        name: 'Losses',
        value: isUnranked ? '`—`' : `\`${profile.losses}L\``,
        inline: true,
      }
    )
    .setFooter({ text: `${totalGames} ranked game${totalGames !== 1 ? 's' : ''} · ${region}` })
    .setTimestamp();

  const alreadyTracked = getTrackedPlayers().some(
    (p) => p.summonerName.toLowerCase() === profile.summonerName.toLowerCase()
  );

  const trackButton = new ButtonBuilder()
    .setCustomId(`track_${profile.summonerName}`)
    .setLabel(alreadyTracked ? 'Already Tracking' : 'Track Player')
    .setEmoji(alreadyTracked ? '✅' : '📡')
    .setStyle(alreadyTracked ? ButtonStyle.Secondary : ButtonStyle.Primary)
    .setDisabled(alreadyTracked);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(trackButton);

  await interaction.editReply({ embeds: [embed], components: [row] });
}
