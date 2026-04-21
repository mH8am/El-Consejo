import { ChatInputCommandInteraction, PermissionResolvable } from 'discord.js';

export function hasPermission(
  interaction: ChatInputCommandInteraction,
  permission: PermissionResolvable
): boolean {
  if (!interaction.memberPermissions) return false;
  return interaction.memberPermissions.has(permission);
}

export async function requirePermission(
  interaction: ChatInputCommandInteraction,
  permission: PermissionResolvable,
  permissionName: string
): Promise<boolean> {
  if (!hasPermission(interaction, permission)) {
    await interaction.reply({
      content: `❌ You need the **${permissionName}** permission to use this command.`,
      ephemeral: true,
    });
    return false;
  }
  return true;
}
