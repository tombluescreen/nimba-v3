const fs = require("fs");
const path = require("path");
const decompress = require("decompress");


const settings = require("../settings/settings.json");

const { Server } = require('./server.js');
const { defaultArg } = require("../utility.js");
const { SERVER_STATUS } = require("./server_status.js")

class Minecraft extends Server {
    constructor(args) {
        super(args);
        
        if (this.config_file_args != undefined) {
            for (const [key, value] of Object.entries(this.config_file_args)) {
                args[key] = value;
            }
        }

        this.type = "minecraft";

        if (settings.java.java_placeholders[args.java_path] != undefined) {
            args.java_path = settings.java.java_placeholders[args.java_path];
        }

        this.java_path = defaultArg(args.java_path, "java");
        this.java_args = defaultArg(args.java_args, "");
        this.jar_path = defaultArg(args.jar_path, "");
        this.jar_args = defaultArg(args.jar_args, "nogui");
    }

    /**
     * If the downloaded file is a .jar then set that file as file to run
     * @returns 
     */
    async postFileDownloadLogic(file_path, reply_wrapper = null) {
        const file_extension_substring = file_path.substring(file_path.length - 4);
        if (file_extension_substring == ".jar") {
            this.jar_path = path.basename(file_path);
        }

        if (file_extension_substring == ".zip") {

            if (reply_wrapper != null) reply_wrapper.update_line(/$/gm, "\:white_check_mark:");
            if (reply_wrapper != null) reply_wrapper.update("Decompressing file... (this could take a while)");
            await decompress(file_path, path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}/`));
            if (reply_wrapper != null) reply_wrapper.update_line(/$/gm, "\:white_check_mark:");
            if (reply_wrapper != null) reply_wrapper.update("Attempting to identify server file...");


            const files = await fs.readdirSync(path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}/`), {recursive: true, withFileTypes:true});

            const jar_files = files.filter(file => {
                return path.extname(file.name) === ".jar";
            });

            let top_level_jar_files = [];
            const first_jar_dir_level = jar_files[0].parentPath.match(/\/|\\/gm).length;
            for (let i = 0; i < jar_files.length; i++) {
                if (jar_files[i].parentPath.match(/\/|\\/gm).length > first_jar_dir_level) {
                    break;
                } else {
                    top_level_jar_files.push(jar_files[i]);
                }
            }

            if (top_level_jar_files.length == 0) {
                //errrr
                console.log("Err");
                throw new Error("Failed to auto detect minecraft server file");
            } else if (top_level_jar_files == 1) {
                //Only one jar file... so thats probably the entry point
                this.cwd = this.cwd + "/" + path.relative(path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}`), top_level_jar_files[0].parentPath);
                this.jar_path = top_level_jar_files[0].name;
            } else {
                for (let i = 0; i < top_level_jar_files.length; i++) {
                    if (top_level_jar_files[i].name.match(/forge/gm) != null) {
                        //This is probably the the forge file
                        this.cwd = this.cwd + "/" + path.relative(path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}`), top_level_jar_files[i].parentPath);
                        this.jar_path = top_level_jar_files[i].name;
                    } else if (top_level_jar_files[i].name.match(/minecraft|mc/gmi) != null) {
                        //this is proably the mc file

                    }
                }
            }

            
            

            //look for subfile

            //look for forge file

            //look for mc_server jar file

            let egg;
        }

        //TODO if zip, unzip and find jar file and launch file
    }

    /**
     * Check if the server is ready by looking for 'Done xxxx' line and if so set server_status
     * @param {*} data Console Line
     */
    checkServerReady(str) {
        const re = /Done \([0-9]*\.[0-9]*s\).*"help"/gm;
        let test_response = re.test(str);
        if (test_response == true) {
            this.setServerStatus(SERVER_STATUS.RUNNING("Minecraft 'Done' line detected"))
            //console.log("Server Ready!!!!");
        }
    }

    /**
     * modify stdout listener to save errors
     * @param {*} data 
     */
    spawn_listener_stdout_func(data) {
        super.spawn_listener_stdout_func(data);
        //Errors in minectaft are pushed to stdout so we do some logic here

        const error_match = /\[[0-9]+:[0-9]+:[0-9]+\] \[ServerMain\/ERROR\]/gm;
        let error_match_test = error_match.test(data.toString());
        if (error_match_test == true) {
            //There is an MC error
            //this.SetServerError(true);
            this.pushErrToConsole(data.toString());
        }

        const fatal_match = /\[[0-9]+:[0-9]+:[0-9]+\] \[.+\/FATAL\]/gm;
        let fatal_match_test = fatal_match.test(data.toString());
        if (fatal_match_test == true) {
            //There is a fatal mc error
            //this.SetServerError(true);
            this.pushErrToConsole(data.toString());
            

            const fatal_server_fail_match = /Failed to start the minecraft server/gm;
            let fatal_server_fail_match_test = fatal_server_fail_match.test(data.toString());
            if (fatal_server_fail_match_test == true) {
                this.setServerStatus(SERVER_STATUS.CRASHED(data.toString()));
            }

        }
        
    }

    /**
     * Get start command for minecraft instance
     * @returns 
     */
    startCommand() {
        const com = `"${this.java_path}" ${this.java_args} -jar "${this.jar_path}" ${this.jar_args}`;
        return com;
    }

    /**
     * Stop minecraft server properly
     */
    stop() {
        this.writeToSpawn("stop");
        this.setServerStatus(SERVER_STATUS.STOPPING("'stop()' called"))
    }

    /**
     * Bypass Minecraft eula asker by making the file early
     */
    acceptEULA() {
        const f = fs.openSync(path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}/eula.txt`), "w");
        fs.writeSync(f, "eula=true"); 
    }

    /**
     * Make sure minecraft settings are saved
     * @param {*} pass_setts 
     */
    saveConfigFile(pass_setts = {}) {
        let setts = {};

        setts.java_path = this.java_path;
        setts.java_args = this.java_args;
        setts.jar_path = this.jar_path;
        setts.jar_args = this.jar_args;

        let final_setts = Object.assign({}, setts, pass_setts);

        super.saveConfigFile(final_setts);
    }

    setServerPropertiesPort() {
        //const f = fs.openSync(path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}/server.properties`), "r+");
        var data = fs.readFileSync(path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}/server.properties`), { encoding: 'utf8', flag: 'r' });
        //server-port
        const server_port_regex = /server-port=[0-9]*/gm;

        data = data.replace(server_port_regex, "server-port=" + this.server_port.port_number);
        
        const f = fs.openSync(path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}/server.properties`), "w");
        fs.writeSync(f, data);
    }

    /**
     * Minecraft first run (only accepts eula right now)
     * @returns 
     */
    firstRun() {
        return new Promise(async (resolve, reject) => {
            this.acceptEULA()
            this.start();
            await this.waitUntilServerReady();
            this.stop();
            this.setServerPropertiesPort();

            resolve();
        })
        
    }

    /**
     * Get the player count by getting a reponse through the terminal
     * @returns 
     */
    async getPlayerCountFromShell() {
        if (this.server_status.equals(SERVER_STATUS.RUNNING()) == false) {
            //Server is not ready for console input
            return null;
        }
        let res = await this.writeToSpawnAndGetResponse("list", 200);
        const player_count_regex = /There are ([0-9]+) of a max of ([0-9]+) players online:/gm;
        let match_res = player_count_regex.exec(res[0]); //Todo: Doesnt account for random data in res
        if (match_res == null) {
            return null;
        }
        const player_count = match_res[1];
        const player_max = match_res[2];

        return [player_count, player_max];
    }

}

module.exports = { Minecraft };