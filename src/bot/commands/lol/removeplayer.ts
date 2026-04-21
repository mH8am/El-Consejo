import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { getTrackedPlayers, removeTrackedPlayer } from '../../../services/lpTracker';
import { successEmbed, errorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('removeplayer')
  .setDescription('Remove a summoner from the LP tracker')
  .addStringOption((opt) =>
    opt
      .setName('name')
      .setDescription('Summoner name to remove')
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focused = interaction.options.getFocused().toLowerCase();
  const choices = getTrackedPlayers()
    .map((p) => p.summonerName)
    .filter((n) => n.toLowerCase().includes(focused))
    .slice(0, 25)
    .map((n) => ({ name: n, value: n }));
  await interaction.respond(choices);
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const name = interaction.options.getString('name', true);
  const removed = removeTrackedPlayer(name);

  if (!removed) {
    await interaction.reply({
      embeds: [errorEmbed(`**${name}** is not currently being tracked.`)],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.reply({
    embeds: [successEmbed('Player Removed', `**${name}** has been removed from the LP tracker.`)],
    flags: MessageFlags.Ephemeral,
  });
}
