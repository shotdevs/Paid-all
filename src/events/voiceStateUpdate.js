const { Events } = require('discord.js');
const { VcTime, GuildConfig } = require('../models'); 

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const member = newState.member;
    if (member.user.bot) return;

    const guildId = newState.guild.id;
    const userId = member.id;

    // Helper: Is the user valid for earning XP? (Not muted, not deafened)
    const isValid = (state) => state.channelId && !state.mute && !state.deaf;

    // 1. HANDLE LEAVING or BECOMING INVALID (Muting/Deafening)
    // If they were previously valid, and now they are leaving OR muting...
    if (oldState.channelId && !oldState.mute && !oldState.deaf) {
        if (!newState.channelId || newState.mute || newState.deaf) {
            
            // Fetch their session
            let userVcData = await VcTime.findOne({ guildId, userId });
            
            // Only calculate if they had a joinTime saved
            if (userVcData && userVcData.joinTime) {
                const now = Date.now();
                const sessionTime = now - new Date(userVcData.joinTime).getTime();
                
                // 1. Save Total Time
                userVcData.timeInVC += sessionTime;
                userVcData.joinTime = null; // Close session

                // 2. Calculate XP (100 XP per minute)
                const minutes = Math.floor(sessionTime / 60000);
                if (minutes > 0) {
                    const xpEarned = minutes * 100;
                    userVcData.voiceXp = (userVcData.voiceXp || 0) + xpEarned;

                    // 3. Check Level Up
                    // Formula: Level * Level * 200 (Adjust difficulty here)
                    const nextLevelXp = (userVcData.voiceLevel + 1) ** 2 * 200;
                    
                    if (userVcData.voiceXp >= nextLevelXp) {
                        userVcData.voiceLevel = (userVcData.voiceLevel || 0) + 1;
                        
                        // Optional: Send Level Up Message
                        const config = await GuildConfig.findOne({ guildId });
                        if (config && config.levelUpChannelId) {
                            const channel = newState.guild.channels.cache.get(config.levelUpChannelId);
                            if (channel) channel.send(`🎙️ **Voice Level Up!** <@${userId}> reached Voice Level ${userVcData.voiceLevel}!`);
                        }
                    }
                }
                await userVcData.save();
            }
        }
    }

    // 2. HANDLE JOINING or BECOMING VALID (Unmuting/Undeafening)
    // If they are now valid, start the timer
    if (isValid(newState)) {
        // Only start timer if they weren't already valid (prevent double counting)
        if (!oldState.channelId || oldState.mute || oldState.deaf) {
            let userVcData = await VcTime.findOne({ guildId, userId });
            if (!userVcData) {
                userVcData = new VcTime({ guildId, userId });
            }
            userVcData.joinTime = Date.now();
            await userVcData.save();
        }
    }
  },
};
