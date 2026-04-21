import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getChallengerLadder, getGrandmasterLadder } from '../../../services/riotApi';
import { errorEmbed } from '../../../utils/embeds';

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

    const entries = tier === 'challenger' ? await getChallengerLadder() : await getGrandmasterLadder();

    if (entries.length === 0) {
      await interaction.editReply({ embeds: [errorEmbed('Could not fetch ladder data. Check your Riot API key.')] });
      return;
    }

    const description = entries
      .slice(0, 10)
      .map((e, i) => `**${i + 1}.** ${e.summonerName} — ${e.leaguePoints} LP (${e.wins}W / ${e.losses}L)`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`🏆 ${tier === 'challenger' ? 'Challenger' : 'Grandmaster'} Ladder — Top 10`)
      .setDescription(description)
      .setFooter({ text: `Region: ${process.env.REGION ?? 'na1'}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}
