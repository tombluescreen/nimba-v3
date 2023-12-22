const { SlashCommandBuilder, AuditLogOptionsType } = require('discord.js');
const path = require("path");

const discordUtils = require("../../utils.js");
const { defaultArg, truncStringToSize } = require("../../../utility.js");
const settings = require("../../../settings/settings.json");
const { Minecraft } = require('../../../classes/minecraft.js');
const { SERVER_STATUS } = require("../../../classes/server_status.js");
const { checkServerPermissions, checkGlobalPermissions, editPerm } = require("../../discord-permissions.js");
const { DiscordUpdateWrapper } = require("../../../classes/progress_update_wrapper.js");

function findServerInGlobalList(argLabel) {
	let foundServer;
	for (var i = 0; i < global.server_list.length; i++) {
		const openServer =  global.server_list[i];
		if (openServer.label.toLowerCase() == argLabel.toLowerCase()) {
			foundServer = openServer;
			break;
		}
	}
	return foundServer;
}
/**
 * Discord Command: /server new minecraft
 */
async function server_new_minecraft(interaction) {
	const member = await interaction.guild.members.fetch(interaction.member.id);
	const perm_res = await checkGlobalPermissions("server_new_minecraft", member);
	if (perm_res == false) {
		interaction.reply("You do not have permissions for this command");
		return;
	}

	let args = {};
	args.label = interaction.options.getString("label");
	args.template = defaultArg(interaction.options.getString("template"), "");
	args.jar_file_type = defaultArg(interaction.options.getString("config_jar_file_type"), "jar");

	args.download_urls = defaultArg([interaction.options.getString("config_jar_file")], []);

	for (let i = 0; i < args.download_urls.length; i++) {
		//check 
	}

	args.java_version = defaultArg(interaction.options.getString("config_java_version"), settings.java.default_java_path);
	
	for (const [key, value] of Object.entries(settings.java.java_placeholders)) { //TODO move this to startcommand maybe
		if (args.java_version == key) {
			//Found a java placeholder in settings
			args.java_version = value;
			break;
		}
	}
	args.java_path = args.java_version;
	
	args.java_args = defaultArg(interaction.options.getString("config_java_args"), settings.minecraft.default_java_args);
	args.jar_args = defaultArg(interaction.options.getString("config_jar_args"), settings.minecraft.default_jar_args);

	await interaction.deferReply();

	const discord_reply_wrapper = new DiscordUpdateWrapper(interaction);

	let new_mc = new Minecraft(args);
	try {
		await new_mc.initFileSystem(discord_reply_wrapper);
	} catch (e) {
		discord_reply_wrapper.update_line(/$/gm, "\:x:");
		discord_reply_wrapper.update(`Server init failed: ${e}`);
		return;
	}
	
	global.server_list.push(new_mc);

	//Add all perms for user who created server
	editPerm(path.resolve(`${settings.base_game_dir}/${new_mc.dir}/perms.json`), "user_whitelist", member.id, "allow", "add", "all");
	discord_reply_wrapper.update_line(/$/gm, "\:x:");
	discord_reply_wrapper.update(`**Server '${new_mc.label}' created.**`);
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

async function server_console_send(interaction) {
	const arglabel = interaction.options.getString("label");
	const foundServer = findServerInGlobalList(arglabel);
	if (foundServer == undefined) {
		interaction.reply("Server cannot be found. Run /server list to see loaded servers");
		return;
	}

	const member = await interaction.guild.members.fetch(interaction.member.id);
	const perm_res = await checkServerPermissions("server_console_send", foundServer, member);
	if (perm_res == false) {
		interaction.reply("You do not have permissions for this command");
		return;
	}

	const argCommand = interaction.options.getString("command");

	await interaction.deferReply();
	let send_response = await foundServer.writeToSpawnAndGetResponse(argCommand);

	interaction.editReply(send_response);

}

async function server_console_get(interaction) {
	const arglabel = interaction.options.getString("label");
	const foundServer = findServerInGlobalList(arglabel);
	if (foundServer == undefined) {
		interaction.reply("Server cannot be found. Run /server list to see loaded servers");
		return;
	}

	const member = await interaction.guild.members.fetch(interaction.member.id);
	const perm_res = await checkServerPermissions("server_console_get", foundServer, member);
	if (perm_res == false) {
		interaction.reply("You do not have permissions for this command");
		return;
	}

	let console_list = foundServer.console_output.slice(-20).reverse();
	
	let allowed_console_list = [];

	const string_seperator =  "\n"

	const max_characters = 2000;
	let rolling_char_counter = 0;
	for (let i = 0; i < console_list.length; i++) {
		let entry_length = console_list[i].length + string_seperator.length + 6;
		if (entry_length+rolling_char_counter > max_characters) {
			break;
		} else {
			allowed_console_list.push(console_list[i]);
			rolling_char_counter += entry_length;
		}
	}

	if (allowed_console_list.length == 0) {
		allowed_console_list.push(truncStringToSize(console_list[0], 2000 - string_seperator.length - 6));
	}

	interaction.reply("```" + allowed_console_list.reverse().join(string_seperator) + "```");
}

async function server_console_thread(interaction) {

}

/**
 * Discord Command: /server permission add
 * @param {*} interaction 
 */
async function server_permission_add(interaction) {
	const arglabel = interaction.options.getString("label");
	const foundServer = findServerInGlobalList(arglabel);
	if (foundServer == undefined) {
		interaction.reply("Server cannot be found. Run /server list to see loaded servers");
		return;
	}

	const member = await interaction.guild.members.fetch(interaction.member.id);
	const perm_res = await checkServerPermissions("server_permission_add", foundServer, member);
	if (perm_res == false) {
		interaction.reply("You do not have permissions for this command");
		return;
	}


	const argMention = interaction.options.getMentionable("mention");
	const argList_type = interaction.options.getString("list_type");
	const argAllow_type = interaction.options.getString("allow_type");
	const argCommand_string = interaction.options.getString("command_string");

	let mentionType;
	let sub_key;
	switch (argMention.constructor.name){
		case ("Role"):
			mentionType = "Role";
			sub_key = "group_" + argList_type;
			break;
		case ("GuildMember"):
			mentionType = "Member";
			sub_key = "user_" + argList_type;
			break;
		case ("User"):
			mentionType = "User";
			sub_key = "user_" + argList_type;
			break;
	}

	editPerm(path.resolve(`${settings.base_game_dir}/${foundServer.dir}/perms.json`), sub_key, argMention.id, argAllow_type, "add", argCommand_string);

	interaction.reply("Permission change successful")	
}

/**
 * Discord Command: /server permission remove
 * @param {*} interaction 
 */
async function server_permission_remove(interaction) {

}

/**
 * Discord Command: /server status
 */
async function server_status(interaction) {
	
	const arglabel = interaction.options.getString("label");
	let foundServer;
	for (var i = 0; i < global.server_list.length; i++) {
		const openServer =  global.server_list[i];
		if (openServer.label.toLowerCase() == arglabel.toLowerCase()) {
			foundServer = openServer;
			break;
		}
	}
	if (foundServer == undefined) {
		interaction.reply("Server cannot be found. Run /server list to see loaded servers");
		return;
	}
	
	const member = await interaction.guild.members.fetch(interaction.member.id);
	const perm_res = await checkServerPermissions("server_status", foundServer, member);
	if (perm_res == false) {
		interaction.reply("You do not have permissions for this command");
		return;
	}
	//console.log(`Perm Result: ${perm_res}`);

	const foundServerStatus = await foundServer.getStatus();
	let outDict = {};
	if (foundServerStatus.equals(SERVER_STATUS.RUNNING())) {
		//Server is running so get some more info
		const mcPlayerCount = await foundServer.getPlayerCountFromShell();
		outDict.PlayerCount = `${mcPlayerCount[0]} of ${mcPlayerCount[1]}`;
	} else {
		outDict.status = foundServerStatus.toPrettyString();
	}
	const embedResponse = discordUtils.dictToEmbed(outDict);
	embedResponse.embeds[0].setTitle(`'${foundServer.label}' status`);
	interaction.reply(embedResponse);
}

async function server_start(interaction) {
	const arglabel = interaction.options.getString("label");
	let foundServer;
	for (var i = 0; i < global.server_list.length; i++) {
		const openServer =  global.server_list[i];
		if (openServer.label.toLowerCase() == arglabel.toLowerCase()) {
			foundServer = openServer;
			break;
		}
	}
	if (foundServer == undefined) {
		interaction.reply("Server cannot be found. Run /server list to see loaded servers");
		return;
	}

	const member = await interaction.guild.members.fetch(interaction.member.id);
	const perm_res = await checkServerPermissions("server_start", foundServer, member);
	if (perm_res == false) {
		interaction.reply("You do not have permissions for this command");
		return;
	}

	const foundServerStatus = foundServer.getStatus();
	if (foundServerStatus.equals(SERVER_STATUS.STOPPED()) == false && foundServerStatus.equals(SERVER_STATUS.CRASHED()) == false) {
		interaction.reply("Server is already running.");
		return;
	}

	await interaction.deferReply();

	foundServer.start();
	const newStatus = await foundServer.waitUntilStatusChanged();
	if (newStatus.equals(SERVER_STATUS.RUNNING())) {
		//Server Started successfully
		interaction.editReply("Server has been started");
	} else if (newStatus.equals(SERVER_STATUS.LOADING())) {
		//Server is still loading
		interaction.editReply("Server is still loading");
	} else if (newStatus.equals(SERVER_STATUS.CRASHED())) {
		interaction.editReply("Server has failed to start");
	} else if (newStatus.equals(SERVER_STATUS.STOPPED())) {
		interaction.editReply("Server has failed to start");
	}

	
}

async function server_stop(interaction) {
	const arglabel = interaction.options.getString("label");
	let argForceQuit = interaction.options.getBoolean("force_quit");
	if (argForceQuit == null) argForceQuit = false;
	let foundServer;
	for (var i = 0; i < global.server_list.length; i++) {
		const openServer =  global.server_list[i];
		if (openServer.label.toLowerCase() == arglabel.toLowerCase()) {
			foundServer = openServer;
			break;
		}
	}
	if (foundServer == undefined) {
		interaction.reply("Server cannot be found. Run /server list to see loaded servers");
		return;
	}

	const member = await interaction.guild.members.fetch(interaction.member.id);
	const perm_res = await checkServerPermissions("server_stop", foundServer, member);
	if (perm_res == false) {
		interaction.reply("You do not have permissions for this command");
		return;
	}

	const foundServerStatus = foundServer.getStatus();
	if (foundServerStatus.equals(SERVER_STATUS.RUNNING()) == false) {
		interaction.reply("Server is not running so I can't stop it.");
		return;
	}

	await interaction.deferReply();

	if (argForceQuit == true) {
		foundServer.forceKill();
	} else if (argForceQuit == false) {
		foundServer.stop();
	}
	
	//await foundServer.IsServerReady();

	interaction.editReply("Server has been stopped");
}

/**
 * Discord Command: /server list
 */
async function server_list(interaction) {
	const member = await interaction.guild.members.fetch(interaction.member.id);
	const perm_res = await checkGlobalPermissions("server_list", member);
	if (perm_res == false) {
		interaction.reply("You do not have permissions for this command");
		return;
	}
	let summaryDict = {};
	for (var i = 0; i < global.server_list.length; i++) {
		const openServer =  global.server_list[i];
		const serverStatus = openServer.getStatus().toPrettyString();
		const serverLabel = openServer.label;
		const serverType = openServer.type;
		summaryDict[serverLabel] = {Type: serverType, Status: serverStatus};
	}
	const outEmbed = discordUtils.dictToEmbed(summaryDict, false);
	outEmbed.embeds[0].setTitle("Server List");
	outEmbed.embeds[0].setDescription("Currently loaded servers\n <label> (<type>, <status>)");
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
		case ("console"):
			switch (subcommand) {
				case ("send"):
					await server_console_send(interaction);
					break;
				case ("get"):
					await server_console_get(interaction);
					break;
				case ("thread"):
					await server_console_thread(interaction);
					break;
			}
			break;
		case ("permission"):
			switch (subcommand) {
				case ("add"):
					await server_permission_add(interaction);
					break;
				case ("remove"):
					await server_permission_remove(interaction);
					break;
				case ("list"):
					//await server_config_set(interaction);
					interaction.reply("Command not implemented yet");
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
				case ("start"):
					await server_start(interaction);
					break;
				case ("stop"):
					await server_stop(interaction);
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
		.addSubcommandGroup(subcommandgroup => 
			subcommandgroup
			.setName("console")
			.setDescription("Server console related commands")
			.addSubcommand(subcommand => 
				subcommand.setName("send")
				.setDescription("Send a string to the server console")
				.addStringOption(option => 
					option.setName("label")
					.setDescription("Label of server")
					.setRequired(true),
				)
				.addStringOption(option =>
					option.setName("command")
					.setDescription("Command string to send to the server")
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
				.addIntegerOption(option =>
					option.setName("line_count")
					.setDescription("Number of lines to get")	
				)
			)
			.addSubcommand(subcommand => 
				subcommand.setName("thread")
				.setDescription("Create a thread to display console output")
				.addStringOption(option => 
					option.setName("label")
					.setDescription("Label of server")
					.setRequired(true),
				)
			)
		)

		.addSubcommandGroup(subcommandgroup => 
			subcommandgroup
			.setName("permission")
			.setDescription("Get and Set server command permissions")
			.addSubcommand(subcommand => 
				subcommand.setName("add")
				.setDescription("Add a permission rule to the server")
				.addStringOption(option => 
					option.setName("label")
					.setDescription("Label of server")
					.setRequired(true),
				)
				.addMentionableOption(option => 
					option.setName("mention")
					.setDescription("The User or Role to add permissions for")
					.setRequired(true),
				)
				.addStringOption(option => 
					option.setName("list_type")
					.setDescription("Add mention to whitelist or blacklist")
					.setRequired(true)
					.addChoices(
						{ name: 'Whitelist', value:'whitelist' },
						{ name: 'Blacklist', value:'blacklist' },
					)
				)
				.addStringOption(option => 
					option.setName("allow_type")
					.setDescription("Add to allowed or disallowed list (only on whitelist)")
					.addChoices(
						{ name: "Allowed Commands", value: "allow" },
						{ name: "Disallowed Commands", value: "disallow" },
					)	
				)
				.addStringOption(option => 
					option.setName("command_string")
					.setDescription("Command name (Only used when whitelist)")	
				)
			)
			.addSubcommand(subcommand => 
				subcommand.setName("remove")
				.setDescription("remove a permission rule to the server")
				.addStringOption(option => 
					option.setName("label")
					.setDescription("Label of server")
					.setRequired(true),
				)
				.addMentionableOption(option => 
					option.setName("mention")
					.setDescription("The User or Role to remove permissions for")
					.setRequired(true),
				)
				.addStringOption(option => 
					option.setName("list_type")
					.setDescription("Remove mention from whitelist or blacklist")
					.setRequired(true)
					.addChoices(
						{ name: 'Whitelist', value:'whitelist' },
						{ name: 'Blacklist', value:'blacklist' },
					)
				)
				.addStringOption(option => 
					option.setName("allow_type")
					.setDescription("Add to allowed or disallowed list")
					.setRequired(true)
					.addChoices(
						{ name: "Allowed Commands", value: "allowed_commands" },
						{ name: "Disallowed Commands", value: "disallowed_commands" },
					)	
				)
				.addStringOption(option => 
					option.setName("command_string")
					.setDescription("Command name (Only used when whitelist)")	
				)
			)
		)
		
		.addSubcommand(subcommand => 
			subcommand
				.setName("start")
				.setDescription("Start server")
				.addStringOption(option => 
					option.setName("label")
					.setDescription("Server Label")
					.setRequired(true),
				)
		)

		.addSubcommand(subcommand => 
			subcommand
				.setName("stop")
				.setDescription("Stop server")
				.addStringOption(option => 
					option.setName("label")
					.setDescription("Server Label")
					.setRequired(true),
				)
				.addBooleanOption(option => 
					option.setName("force_quit")
					.setDescription("Force quit (Warning: May cause data loss)"),
				),

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
