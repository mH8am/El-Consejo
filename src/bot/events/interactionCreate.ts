import { Interaction } from 'discord.js';
import { client } from '../client';
import { log } from '../../utils/logger';
import { errorEmbed, successEmbed } from '../../utils/embeds';
import { checkCooldown } from '../../utils/cooldown';
import { addTrackedPlayer, getTrackedPlayers } from '../../services/lpTracker';
import { getFullProfile } from '../../services/riotApi';

client.on('interactionCreate', async (interaction: Interaction) => {
  // Handle Track Player button
  if (interaction.isButton() && interaction.customId.startsWith('track_')) {
    const summonerName = interaction.customId.slice('track_'.length);

    const already = getTrackedPlayers().some(
      (p) => p.summonerName.toLowerCase() === summonerName.toLowerCase()
    );
    if (already) {
      await interaction.reply({ embeds: [errorEmbed(`**${summonerName}** is already being tracked.`)], ephemeral: true });
      return;
    }

    const profile = await getFullProfile(summonerName);
    if (!profile) {
      await interaction.reply({ embeds: [errorEmbed(`Could not fetch data for **${summonerName}**.`)], ephemeral: true });
      return;
    }

    addTrackedPlayer(profile);
    await interaction.reply({
      embeds: [successEmbed('📡 Now Tracking', `**${profile.summonerName}** has been added to the LP tracker.`)],
      ephemeral: true,
    });
    return;
  }

  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (command?.autocomplete) {
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        log('error', `Autocomplete error for ${interaction.commandName}: ${(err as Error).message}`);
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: '❌ Unknown command.', ephemeral: true });
    return;
  }

  const remaining = checkCooldown(interaction.user.id, command);
  if (remaining > 0) {
    await interaction.reply({
      content: `⏳ Please wait **${remaining}s** before using \`/${interaction.commandName}\` again.`,
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    log('error', `Error executing command ${interaction.commandName}: ${(err as Error).message}`);
    const embed = errorEmbed('Something went wrong while running this command.');
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
});
