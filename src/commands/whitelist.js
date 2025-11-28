const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { AntiNuke } = require('../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Manage anti-nuke whitelist.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a user to the whitelist.')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to whitelist.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a user from the whitelist.')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to remove from whitelist.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all whitelisted users.')
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    let antiNuke = await AntiNuke.findOne({ guildId });
    if (!antiNuke) {
      antiNuke = new AntiNuke({ guildId });
      await antiNuke.save();
    }

    if (subcommand === 'add') {
      const user = interaction.options.getUser('user');

      if (antiNuke.whitelistedUsers.includes(user.id)) {
        return interaction.reply({
          content: `${user.tag} is already whitelisted.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      antiNuke.whitelistedUsers.push(user.id);
      await antiNuke.save();

      await interaction.reply({
        content: `✅ Added ${user.tag} to the whitelist.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (subcommand === 'remove') {
      const user = interaction.options.getUser('user');

      if (!antiNuke.whitelistedUsers.includes(user.id)) {
        return interaction.reply({
          content: `${user.tag} is not whitelisted.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      antiNuke.whitelistedUsers = antiNuke.whitelistedUsers.filter(id => id !== user.id);
      await antiNuke.save();

      await interaction.reply({
        content: `✅ Removed ${user.tag} from the whitelist.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (subcommand === 'list') {
      if (antiNuke.whitelistedUsers.length === 0) {
        return interaction.reply({
          content: 'No users are currently whitelisted.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const userList = antiNuke.whitelistedUsers
        .map((id, index) => `${index + 1}. <@${id}> (${id})`)
        .join('\n');

      await interaction.reply({
        content: `**Whitelisted Users (${antiNuke.whitelistedUsers.length}):**\n${userList}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
