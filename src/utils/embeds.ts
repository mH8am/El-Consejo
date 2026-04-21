import { EmbedBuilder } from 'discord.js';
import { TrackedPlayer } from '../typings/index';

export function successEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

export function errorEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('❌ Error')
    .setDescription(description)
    .setTimestamp();
}

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

export function lpGainEmbed(player: TrackedPlayer, change: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`📈 LP Update — ${player.summonerName}`)
    .addFields(
      { name: '✅ Gained LP', value: `+${change} LP`, inline: true },
      { name: '📊 Current LP', value: `${player.tier} ${player.rank} — ${player.lp} LP`, inline: true },
      { name: '🏆 Win/Loss', value: `${player.wins}W / ${player.losses}L`, inline: true }
    )
    .setTimestamp();
}

export function lpLossEmbed(player: TrackedPlayer, change: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle(`📉 LP Update — ${player.summonerName}`)
    .addFields(
      { name: '❌ Lost LP', value: `${change} LP`, inline: true },
      { name: '📊 Current LP', value: `${player.tier} ${player.rank} — ${player.lp} LP`, inline: true },
      { name: '🏆 Win/Loss', value: `${player.wins}W / ${player.losses}L`, inline: true }
    )
    .setTimestamp();
}
