const path = require("path");
const settings = require("../settings/settings.json")
const fs = require("fs");

function checkCommandString(x, command_string) {
    const res = x == command_string; 
    return res;
}

function editPerm(file_path, sub_key, id, allow_or_disallow, add_or_remove, command_string=null) {
    var f = fs.readFileSync(file_path, { encoding: 'utf8', flag: 'r' });
    
    let data = JSON.parse(f);
    

    //init discord if doesnt exist
    if (data.discord == undefined) {
        data.discord = {};
    }

    const whitelist_str_regex = /whitelist/gm;
    const blacklist_str_regex = /blacklist/gm;

    const whitelist_test = whitelist_str_regex.test(sub_key);
    const blacklist_test = blacklist_str_regex.test(sub_key);

    if (data.discord[sub_key] == undefined) {
        
        //If its a whitelist we set as a dict
        //If blacklist set as array
        let new_empty_structure = null;

        if (whitelist_test == true) new_empty_structure = {};
        if (blacklist_test == true) new_empty_structure = [];
        

        data.discord[sub_key] = new_empty_structure;
    }

    if (whitelist_test == true) {
        let foundObj = null;
        for (const [key, value] of Object.entries(data.discord[sub_key])) {
            if (key == id) {
                foundObj = value;
            }
        }

        if (foundObj == null) {
            //no entry exists for this id
            data.discord[sub_key][id] = {
                allowed_commands: [],
                disallowed_commands: [],
            }
            data.discord[sub_key][id];
        }

        let sub_sub_key = null;
        if (allow_or_disallow.toLowerCase() == "allow") {
            sub_sub_key = "allowed_commands";
        }

        if (allow_or_disallow.toLowerCase() == "disallow") {
            sub_sub_key = "disallowed_commands";
        }

        const command_string_in_arr = data.discord[sub_key][id][sub_sub_key].findIndex((data)=>{return checkCommandString(data, command_string)});

        if (command_string_in_arr == -1 && add_or_remove.toLowerCase() == "add") {
            data.discord[sub_key][id][sub_sub_key].push(command_string);
        } else if (add_or_remove.toLowerCase() == "remove") {
            data.discord[sub_key][id][sub_sub_key].pop(command_string_in_arr);
        }
        

        
        
    }

    if (blacklist_test == true) {
        const command_string_in_arr = data.discord[sub_key].findIndex((data)=>{return checkCommandString(data, id)});

        if (command_string_in_arr == -1 && add_or_remove.toLowerCase() == "add") {
            data.discord[sub_key].push(id);
        } else if (add_or_remove.toLowerCase() == "remove") {
            data.discord[sub_key].pop(command_string_in_arr);
        }

    }


    const fw = fs.openSync(file_path, "w");
    fs.writeSync(fw, JSON.stringify(data, undefined, " "));



}

function analyzePermissionsFile(perm_file_path, command_string, discord_user) {
    let can_use_command = null;
    var data = fs.readFileSync(perm_file_path, { encoding: 'utf8', flag: 'r' });
    
    let perm_args = JSON.parse(data);
    let final_disallowed_commands = {};

    

    //const roles = user_discord.roles;
    //const eggs = await user_discord.fetch()
    //const bacon = user_discord.roles.cache;
    //const group_return_test = user_discord.roles.cache.has("1187086501775937637");


    if (perm_args.discord != undefined) {
        //Deal with blacklist first
        if (perm_args.discord.user_blacklist != undefined) {
            for (let i = 0; i < perm_args.discord.user_blacklist.length; i++) {
                const open_file_user_id = perm_args.discord.user_blacklist[i];
                
                if (discord_user.id == open_file_user_id) {
                    //User is black listed so they cannot use command
                    return false;
                }
            }
        }

        if (perm_args.discord.group_blacklist != undefined) {
            for (let i = 0; i < perm_args.discord.group_blacklist.length; i++) {
                const open_file_group = perm_args.discord.group_blacklist[i];
                const group_return = discord_user.roles.cache.has(open_file_group);
                if (group_return == true) {
                    //User has a black listed role so they cannot use command
                    return false;
                }   
            }
        }

        //check group whitelist
        if (perm_args.discord.group_whitelist != undefined) {
            for (const [key, value] of Object.entries(perm_args.discord.group_whitelist)) {
                const open_file_group = key;

                const group_return = discord_user.roles.cache.has(open_file_group);
                if (group_return == true) {
                    //User has a black listed role so they cannot use command
                    //User is on the whitelist
                    
                    const allowed_commands = value.allowed_commands;
                    const disallowed_commands = value.disallowed_commands;
                    const command_string_in_allowed = allowed_commands.findIndex((data)=>{return checkCommandString(data, command_string)});
                    const all_in_allowed = allowed_commands.findIndex((data)=>{return checkCommandString(data, "all")});
                    const command_string_in_disallowed = disallowed_commands.findIndex((data)=>{return checkCommandString(data, command_string)});
                    if (command_string_in_allowed != -1 || all_in_allowed != -1) {
                        if (can_use_command == null) can_use_command = true; 
                        
                    }

                    if (command_string_in_disallowed != -1) {
                        can_use_command = false;
                    }
                }   
                
                
            }
        }

        //check user whitelist
        if (perm_args.discord.user_whitelist != undefined) {
            for (const [key, value] of Object.entries(perm_args.discord.user_whitelist)) {
                
                const open_file_user_id = key;
                
                if (discord_user.id == open_file_user_id) {
                    //User is on the whitelist
                    
                    const allowed_commands = value.allowed_commands;
                    const disallowed_commands = value.disallowed_commands;
                    const command_string_in_allowed = allowed_commands.findIndex((data)=>{return checkCommandString(data, command_string)});
                    const all_in_allowed = allowed_commands.findIndex((data)=>{return checkCommandString(data, "all")});
                    const command_string_in_disallowed = disallowed_commands.findIndex((data)=>{return checkCommandString(data, command_string)});
                    if (command_string_in_allowed != -1 || all_in_allowed != -1) {
                        if (can_use_command == null) can_use_command = true;
                    }

                    if (command_string_in_disallowed != -1) {
                        can_use_command = false;
                    }
                    
                }
            }
        }
    }


    
    if (can_use_command == null) can_use_command = false;
    //Check perm file for user_discord_id
    return can_use_command;
}

async function checkGlobalPermissions(command_string, user_discord) {
    const perm_file_path = path.resolve(`${settings.base_game_dir}/perms.json`);

    const result = analyzePermissionsFile(perm_file_path, command_string, user_discord);
    return result;
}

async function checkServerPermissions(command_string, server_instace, user_discord) {
    //Get perm file
    const perm_file_path = path.resolve(`${settings.base_game_dir}/${server_instace.dir}/perms.json`);

    const result = analyzePermissionsFile(perm_file_path, command_string, user_discord);
    return result;
    
    
}

function savePerms(perm_file_path) {

    var pre_data = {};
    perm_file_path = path.resolve(`${perm_file_path}/perms.json`)
    if (fs.existsSync(perm_file_path)) {
        var data = fs.readFileSync(perm_file_path, { encoding: 'utf8', flag: 'r' });
        pre_data = JSON.parse(data);
        //var data = require(path.resolve(`${settings.base_game_dir}/${server_instace.dir}/perms.json`));
        
    }

    const f = fs.openSync(perm_file_path, "w");
    fs.writeSync(f, JSON.stringify(pre_data, undefined, " "));

    
}

module.exports = { checkServerPermissions, checkGlobalPermissions, savePerms, editPerm };