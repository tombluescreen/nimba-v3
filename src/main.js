const fs = require("fs");
const path = require("path");

const settings = require("./settings/settings.json");

const { Minecraft } = require("./classes/minecraft.js");
const { Server } = require("./classes/server.js");

const disc = require("./discord/utils.js");
const discPerms = require("./discord/discord-permissions.js");

global.server_list = [];

/**
 * loop through every folder is base_game_dir looking for a placed config file
 * and load that server if its found
 */
async function loadServersFromFolders() {
    return new Promise(async (resolve, reject) => {
        let dirs = fs.readdirSync(path.resolve(`${settings.base_game_dir}`), {withFileTypes:true}).filter(dirent => dirent.isDirectory())
        console.log("Loading Servers from GAME_DIR");
        dirs.forEach((value) => {
            const config_path = path.resolve(`${value.path}/${value.name}/nimba-config.json`);
            if (fs.existsSync(config_path)) {
                console.log("Found Config file")
                const {type} = require(config_path);
                var ba;
                switch (type) {
                    case "minecraft":
                        ba = new Minecraft({config_file_path:config_path});
                        break;
                    default: case "base":
                        ba = new Server({config_file_path:config_path});
                        break
                }

                global.server_list.push(ba);
            }

        });
        resolve();
        
    });
    
}

async function test() {
    var mc = new Minecraft({});

    //mc.start_command = 'cd "C:\\Users\\thoma\\Downloads\\mcser" && "C:\\Program Files\\Java\\jdk-21\\bin\\java.exe" -Xmx1024M -Xms1024M -jar "C:\\Users\\thoma\\Downloads\\mcser\\server.jar" nogui';
    //mc.start_command = 'cd "C:\\Users\\thoma\\Downloads\\mcser"';
    //mc.start_command = '"C:\\Program Files\\Java\\jdk-21\\bin\\java.exe" -Xmx1024M -Xms1024M -jar "C:\\Users\\thoma\\Downloads\\mcser\\server.jar" nogui';
    //mc.cwd = "C:\\Users\\thoma\\Downloads\\mcser";
    //mc.start_command = 'help'; //mc.start_command = 'help';
    mc.download_urls = ["https://piston-data.mojang.com/v1/objects/8dd1a28015f51b1803213892b50b7b4fc76e594d/server.jar"];
    mc.java_path = "java";
    mc.java_args = "-Xmx1024M -Xms1024M";
    mc.jar_path = "./server.jar";
    mc.jar_args = "nogui";

    await mc.InitFileSystem();
    return;
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
} 

var events = require('events');
 

async function main() {
    //var eventEmitter = new events.EventEmitter();    
    
    //eventEmitter.on();

    //const inter = setInterval(() => {
    //    eventEmitter.emit("egg");
    //});

    //return;
    //await test();
    //await mc.InitFileSystem();

    //let first_parent_path = "C:\\Users\\thoma\\Downloads\\mcser\\server.jar";
    //let first_match = first_parent_path.match(/\/|\\/g);

    await loadServersFromFolders();
    discPerms.savePerms(path.resolve(settings.base_game_dir));
    
    console.log(`Loaded ${global.server_list.length} servers`)
    disc.init_discordjs(); //Init discordjs
    //TODO: Register commands in all joined servers with deploy-command.js
    //global.server_list[0].Start();
    //await global.server_list[0].IsServerReady();
    //console.log("It works Lets goooo")
    //let beans = await server_list[0].WriteToSpawnAndGetResponse("list");
    //console.log(beans);
    //global.server_list[0].GetStatus();
    //const inter = setInterval(() => {
    //    console.log("Eggs and bacon")
    //    global.server_list[0].WriteToSpawn("say hello");    
    //}, 1000);

}

main();

