const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const secrets = require('../settings/secrets.json');
const clientId = secrets.discord.client_id;
const guildIds = ["1128738286635077805", "632965369656639498"];
const token = secrets.discord.token;


function deploy_commands() {
	const commands = [];
	// Grab all the command files from the commands directory you created earlier
	const foldersPath = path.join(__dirname, 'commands');
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		// Grab all the command files from the commands directory you created earlier
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}

	// Construct and prepare an instance of the REST module
	const rest = new REST().setToken(token);

	// and deploy your commands!
	(async () => {
		try {
			console.log(`Started refreshing ${commands.length} application (/) commands.`);

			// The put method is used to fully refresh all commands in the guild with the current set
			for (let i = 0; i < guildIds.length; i++) {
				console.log(`Registering to ${guildIds[i]}`);
				const data = await rest.put(
					Routes.applicationGuildCommands(clientId, guildIds[i]),
					{ body: commands },
				);
			}
			

			console.log(`Successfully reloaded ${data.length} application (/) commands.`);
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}
	})();

}
deploy_commands();

module.exports = {deploy_commands};