const { Events, AuditLogEvent } = require('discord.js');
const { checkRoleSpam } = require('../utils/antiNukeActions');

module.exports = {
  name: Events.GuildRoleDelete,
  async execute(role) {
    try {
      const auditLogs = await role.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleDelete,
        limit: 1,
      });

      const log = auditLogs.entries.first();
      if (!log) return;

      await checkRoleSpam(role.guild, log.executor);
    } catch (error) {
      console.error('Role delete anti-nuke error:', error);
    }
  },
};
