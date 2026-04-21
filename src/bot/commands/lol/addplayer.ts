import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { getFullProfile } from '../../../services/riotApi';
import { addTrackedPlayer, getTrackedPlayers } from '../../../services/lpTracker';
import { successEmbed, errorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('addplayer')
  .setDescription('Add a summoner to the LP tracker')
  .addStringOption((opt) =>
    opt.setName('name').setDescription('Riot ID — GameName#Tag (e.g. Faker#KR1)').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const name = interaction.options.getString('name', true);

  if (!name.includes('#')) {
    await interaction.editReply({
      embeds: [errorEmbed('Please use **Riot ID** format: `GameName#Tag` (e.g. `Faker#KR1`).')],
    });
    return;
  }

  const existing = getTrackedPlayers().find(
    (p) => p.summonerName.toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    await interaction.editReply({
      embeds: [errorEmbed(`**${name}** is already being tracked.`)],
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

  addTrackedPlayer(profile);

  await interaction.editReply({
    embeds: [
      successEmbed(
        '✅ Player Added',
        `**${profile.summonerName}** (${profile.tier} ${profile.rank} — ${profile.lp} LP) is now being tracked.`
      ),
    ],
  });
}
