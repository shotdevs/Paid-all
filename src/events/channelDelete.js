const { Events, AuditLogEvent } = require('discord.js');
const { checkChannelSpam } = require('../utils/antiNukeActions');

module.exports = {
  name: Events.ChannelDelete,
  async execute(channel) {
    if (!channel.guild) return;

    try {
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 1,
      });

      const log = auditLogs.entries.first();
      if (!log) return;

      await checkChannelSpam(channel.guild, log.executor);
    } catch (error) {
      console.error('Channel delete anti-nuke error:', error);
    }
  },
};
