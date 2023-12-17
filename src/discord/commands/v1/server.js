const { SlashCommandBuilder } = require('discord.js');

/**
 * Decide what function to run depending on discord context
 * @param {*} interaction Discord context
 */
async function server_command_director(interaction) {
	// Command name is always server
	//TODO: Get command context values
	
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
				.addStringOption(option => 
					option.setName("config_jar_file")
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
				
			),
	async execute(interaction) {
		///await interaction.reply('Pong!');
		await server_command_director(interaction);
	},
};
