const { SlashCommandBuilder } = require('discord.js');
const discordUtils = require("../../utils.js");

/**
 * Discord Command: /server new minecraft
 */
async function server_new_minecraft(interaction) {

}

/**
 * Discord Command: /server config all
 */
async function server_config_all(interaction) {
	
}

/**
 * Discord Command: /server config get
 */
async function server_config_get(interaction) {
	
}

/**
 * Discord Command: /server config set
 */
async function server_config_set(interaction) {
	
}

/**
 * Discord Command: /server status
 */
async function server_status(interaction) {
	
}

/**
 * Discord Command: /server list
 */
async function server_list(interaction) {
	let summaryDict = {};
	for (var i = 0; i < global.server_list.length; i++) {
		const openServer =  global.server_list[i];
		const serverStatusString = await openServer.GetStatusString();
		const serverLabel = openServer.label;
		const serverType = openServer.type;
		summaryDict[serverLabel] = `Type: ${serverType} > Status: ${serverStatusString}`;
	}
	const outEmbed = discordUtils.dictToEmbed(summaryDict);
	outEmbed.embeds[0].setTitle("Server List");
	outEmbed.embeds[0].setDescription("Currently loaded servers");
	outEmbed.embeds[0].setTimestamp();
	
	interaction.reply(outEmbed);
}

/**
 * Decide what function to run depending on discord context
 * @param {*} interaction Discord context
 */
async function server_command_director(interaction) {
	// Command name is always server
	//TODO: Get command context values
	const group = interaction.options.getSubcommandGroup();
	const subcommand = interaction.options.getSubcommand();
	switch (group) {
		case ("new"):
			switch (subcommand) {
				case ("minecraft"):
					await server_new_minecraft(interaction)
					break;
			}
			break;
		case ("config"):
			switch (subcommand) {
				case ("all"):
					await server_config_all(interaction);
					break;
				case ("get"):
					await server_config_get(interaction);
					break;
				case ("set"):
					await server_config_set(interaction);
					break;
			}
			break;
		default:
			switch (subcommand) {
				case ("status"):
					await server_status(interaction);
					break;
				case ("list"):
					await server_list(interaction);
					break;
			}
			break;
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Server Related Commands')
		.addSubcommandGroup(subcommandgroup =>
			subcommandgroup.setName("new")
			.setDescription("Create a new server")
			.addSubcommand(subcommand => 
				subcommand
				.setName("minecraft")
				.setDescription("Create a new minecraft Server")
				.addStringOption(option => 
					option.setName("label")
						.setDescription("New Server Label")
						.setRequired(true),
				)
				.addStringOption(option => 
					option.setName("template")
						.setDescription("Template to copy config from")
				)
				.addStringOption(option => //Maybe I could do this automatically
					option.setName("config_jar_file_type")
						.setDescription("What type is the 'jar' file? (JAR, ZIP)") 
				)
				.addStringOption(option => 
					option.setName("config_jar_file")
						.setDescription("URL of jar or zip file to download")
				)
				.addStringOption(option => 
					option.setName("config_java_version")
						.setDescription("Java Version to use")
				)
				.addStringOption(option => 
					option.setName("config_java_args")
						.setDescription("Java arguments to use when running")
				)
				.addStringOption(option => 
					option.setName("config_jar_args")
						.setDescription("URL of jar file to download")
				)
			)
		)
		.addSubcommandGroup(subcommandgroup => 
			subcommandgroup
			.setName("config")
			.setDescription("Get and Set server configs")
			.addSubcommand(subcommand => 
				subcommand.setName("all")
				.setDescription("Get all configs from server")
				.addStringOption(option => 
					option.setName("label")
					.setDescription("Label of server")
					.setRequired(true),
				)
			)
			.addSubcommand(subcommand => 
				subcommand.setName("get")
				.setDescription("Get a config")
				.addStringOption(option => 
					option.setName("label")
					.setDescription("Label of server")
					.setRequired(true),
				)
				.addStringOption(option => 
					option.setName("config_name")
					.setDescription("Name of the config")
					.setRequired(true),
				)
			)
			.addSubcommand(subcommand => 
				subcommand.setName("set")
				.setDescription("Set a config")
				.addStringOption(option => 
					option.setName("label")
					.setDescription("Label of server")
					.setRequired(true),
				)
				.addStringOption(option => 
					option.setName("config_name")
					.setDescription("Name of the config")
					.setRequired(true),
				)
				.addStringOption(option => 
					option.setName("new_value")
					.setDescription("New value of the config item")
					.setRequired(true),
				)
			)
		)
		
		.addSubcommand(subcommand => 
			subcommand
				.setName("status")
				.setDescription("Status of loaded server")
				.addStringOption(option => 
					option.setName("label")
					.setDescription("Server Label")
					.setRequired(true),
				)
				
			)
		.addSubcommand(subcommand => 
			subcommand
				.setName("list")
				.setDescription("List all loaded servers")
				// .addStringOption(option => 
				// 	option.setName("label")
				// 	.setDescription("Server Label")
				// 	.setRequired(true),
				// )
				
			),
	async execute(interaction) {
		///await interaction.reply('Pong!');
		await server_command_director(interaction);
	},
};
