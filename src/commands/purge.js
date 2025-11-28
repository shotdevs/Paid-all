const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a number of messages from the channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100).')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Only delete messages from this user.')
    ),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      
      let messagesToDelete = messages.filter(msg => {
        const isOlderThan14Days = Date.now() - msg.createdTimestamp > 14 * 24 * 60 * 60 * 1000;
        if (isOlderThan14Days) return false;
        if (targetUser) return msg.author.id === targetUser.id;
        return true;
      });

      messagesToDelete = Array.from(messagesToDelete.values()).slice(0, amount);

      if (messagesToDelete.length === 0) {
        return interaction.editReply({
          content: 'No messages found to delete.',
        });
      }

      await interaction.channel.bulkDelete(messagesToDelete, true);

      await interaction.editReply({
        content: `Successfully deleted ${messagesToDelete.length} message(s).`,
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: 'Failed to delete messages. Make sure I have the proper permissions.',
      });
    }
  },
};
