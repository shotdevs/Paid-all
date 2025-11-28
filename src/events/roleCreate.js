const { Events, AuditLogEvent } = require('discord.js');
const { checkRoleSpam } = require('../utils/antiNukeActions');

module.exports = {
  name: Events.GuildRoleCreate,
  async execute(role) {
    try {
      const auditLogs = await role.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleCreate,
        limit: 1,
      });

      const log = auditLogs.entries.first();
      if (!log) return;

      await checkRoleSpam(role.guild, log.executor);
    } catch (error) {
      console.error('Role create anti-nuke error:', error);
    }
  },
};
