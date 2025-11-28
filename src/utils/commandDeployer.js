require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

async function deployCommands(mode = 'global', guildId = null) {
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    logger.logInfo(`📂 Loading commands from: ${commandsPath}`);
    console.log(`Found ${commandFiles.length} command files`);

    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        commands.push(command.data.toJSON());
        console.log(`  ✓ Loaded: ${command.data.name} (${file})`);
    }

    console.log(`\n📦 Total commands to deploy: ${commands.length}`);
    console.log(`🔧 Deployment mode: ${mode.toUpperCase()}`);
    if (guildId) console.log(`🏠 Target guild ID: ${guildId}`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        logger.logInfo('Started refreshing application (/) commands.');
        console.log('\n⏳ Deploying commands to Discord API...');

        const startTime = Date.now();

        if (mode === 'global') {
            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: commands },
            );
            const elapsed = Date.now() - startTime;
            logger.logInfo('Successfully reloaded application (/) commands globally.');
            console.log(`✅ Global deployment completed in ${elapsed}ms`);
            console.log(`📊 Deployed ${commands.length} commands globally`);
            console.log(`⚠️  Note: Global commands may take up to 1 hour to propagate`);
        } else if (mode === 'guild' && guildId) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
                { body: commands },
            );
            const elapsed = Date.now() - startTime;
            logger.logInfo(`Successfully reloaded application (/) commands for guild ${guildId}.`);
            console.log(`✅ Guild deployment completed in ${elapsed}ms`);
            console.log(`📊 Deployed ${commands.length} commands to guild ${guildId}`);
            console.log(`✨ Guild commands are available immediately`);
        } else {
            throw new Error("Invalid deployment mode or missing guildId for 'guild' mode.");
        }

        console.log('\n📋 Deployed commands:');
        commands.forEach((cmd, index) => {
            console.log(`  ${index + 1}. /${cmd.name} - ${cmd.description}`);
        });

    } catch (error) {
        console.error('\n❌ Deployment failed!');
        console.error(`Error: ${error.message}`);
        logger.logError(error);
    }
}


if (require.main === module) {
    const args = process.argv.slice(2);
    const mode = args[0] || 'global';
    const guildId = args[1] || null;
    deployCommands(mode, guildId);
}


module.exports = { deployCommands };