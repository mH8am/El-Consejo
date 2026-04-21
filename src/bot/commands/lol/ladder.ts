import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getChallengerLadder, getGrandmasterLadder } from '../../../services/riotApi';
import { errorEmbed, medal, winRate } from '../../../utils/embeds';

export const cooldown = 15;

export const data = new SlashCommandBuilder()
  .setName('lol')
  .setDescription('League of Legends commands')
  .addSubcommand((sub) =>
    sub
      .setName('ladder')
      .setDescription('Show top 10 Challenger or Grandmaster players')
      .addStringOption((opt) =>
        opt
          .setName('tier')
          .setDescription('Ladder tier to show')
          .setRequired(true)
          .addChoices(
            { name: 'Challenger', value: 'challenger' },
            { name: 'Grandmaster', value: 'grandmaster' }
          )
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();

  if (sub === 'ladder') {
    await interaction.deferReply();
    const tier = interaction.options.getString('tier', true);
    const isChallenger = tier === 'challenger';

    const entries = isChallenger ? await getChallengerLadder() : await getGrandmasterLadder();

    if (entries.length === 0) {
      await interaction.editReply({ embeds: [errorEmbed('Could not fetch ladder data. Check your Riot API key.')] });
      return;
    }

    const region = (process.env.REGION ?? 'na1').toUpperCase();

    const description = entries
      .slice(0, 10)
      .map((e, i) => {
        const wr = winRate(e.wins, e.losses);
        const prefix = medal(i);
        return `${prefix} **${e.displayName}**\n┣ ${e.leaguePoints.toLocaleString()} LP\n┗ ${e.wins}W / ${e.losses}L · ${wr} WR`;
      })
      .join('\n\n');

    const tierLabel = isChallenger ? 'Challenger 🏆' : 'Grandmaster 👑';
    const color = isChallenger ? 0xf1c40f : 0xe74c3c;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${tierLabel} Ladder — Top 10`)
      .setDescription(description)
      .setFooter({ text: `Region: ${region}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}
