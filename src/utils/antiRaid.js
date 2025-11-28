const { AntiNuke } = require('../models');

const joinCache = new Map();

async function checkAntiRaid(member) {
    if (!member.guild) return false;

    const antiNuke = await AntiNuke.findOne({ guildId: member.guild.id });
    if (!antiNuke || !antiNuke.enabled || !antiNuke.antiRaid.enabled) return false;

    const now = Date.now();
    const guildId = member.guild.id;

    if (!joinCache.has(guildId)) {
        joinCache.set(guildId, []);
    }

    const guildJoins = joinCache.get(guildId);
    guildJoins.push({ userId: member.id, timestamp: now });

    const recentJoins = guildJoins.filter(
        join => now - join.timestamp < antiNuke.antiRaid.timeWindow
    );
    joinCache.set(guildId, recentJoins);

    if (recentJoins.length >= antiNuke.antiRaid.maxJoins) {
        try {
            for (const join of recentJoins) {
                const raidMember = member.guild.members.cache.get(join.userId);
                if (!raidMember) continue;

                if (antiNuke.whitelistedUsers.includes(raidMember.id)) continue;

                if (antiNuke.antiRaid.action === 'kick') {
                    await raidMember.kick('Anti-Raid: Mass join detected').catch(console.error);
                } else if (antiNuke.antiRaid.action === 'ban') {
                    await raidMember.ban({ reason: 'Anti-Raid: Mass join detected' }).catch(console.error);
                }
            }

            if (antiNuke.logChannel) {
                const logChannel = member.guild.channels.cache.get(antiNuke.logChannel);
                if (logChannel) {
                    await logChannel.send({
                        content: `🛡️ **Anti-Raid Alert**\n\n**Action:** ${recentJoins.length} users ${antiNuke.antiRaid.action}ed\n**Reason:** Mass join detected (${recentJoins.length} joins in ${antiNuke.antiRaid.timeWindow}ms)\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    });
                }
            }

            joinCache.delete(guildId);
            return true;
        } catch (error) {
            console.error('Anti-Raid action error:', error);
        }
    }

    return false;
}

setInterval(() => {
    const now = Date.now();
    for (const [guildId, joins] of joinCache.entries()) {
        const filtered = joins.filter(j => now - j.timestamp < 60000);
        if (filtered.length === 0) {
            joinCache.delete(guildId);
        } else {
            joinCache.set(guildId, filtered);
        }
    }
}, 60000);

module.exports = { checkAntiRaid };
