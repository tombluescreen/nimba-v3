const Discord = require("discord.js");
const path = require("path");
const fs = require("fs");


const secrets = require("../settings/secrets.json")

function init_discordjs() {
    const client = new Discord.Client({ intents: [/*Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessages, Discord.GatewayIntentBits.MessageContent, Discord.GatewayIntentBits.GuildMembers*/] });

    client.commands = new Discord.Collection();
    const foldersPath = path.join(__dirname, './commands');
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
				client.commands.set(command.data.name, command);
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}

    client.once(Discord.Events.ClientReady, () => {
		console.log('Ready!');
	});

    client.on(Discord.Events.InteractionCreate, async interaction => {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);
	
			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}
		
			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
				} else {
					await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
				}
			}
        }
		// else if (!interaction.isChatInputCommand()) {
		// 	let btn_ident = interaction.customId.split('#');

		// 	let btn_string = btn_ident[btn_ident.length - 2] + '#' + btn_ident[btn_ident.length - 1];

		// 	const button_interaction = interaction.client.button_interactions.get((btn_string));

		// 	if (!button_interaction) {
		// 		console.error(`No command matching ${interaction.commandName} was found.`);
		// 		return;
		// 	}

		// 	//Log button action in DB
		// 	command(button_interaction);
		// }
		//TODO move interactions here


		if (!interaction.isChatInputCommand()) return;
	
		
	});
	client.login(secrets.discord.token);

}

module.exports = {init_discordjs};