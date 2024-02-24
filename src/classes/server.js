const { spawn, exec } = require("child_process");
const { Readable } = require('stream');
const fs = require("fs");
const path = require("path");
const http = require('https'); 
const fetch = require("node-fetch");

const settings = require("../settings/settings.json");

const { defaultArg } = require("../utility.js");

const { SERVER_STATUS } = require("./server_status.js")
const { savePerms } = require("../discord/discord-permissions.js");
const { getAvaliblePort } = require("../classes/port_manager.js");


class Server {
    constructor(args) {
        //this.init_args = {};
        if (args.config_file_path != undefined) {
            // load data from config file
            var data = fs.readFileSync(args.config_file_path, { encoding: 'utf8', flag: 'r' });
            this.config_file_args = JSON.parse(data);
            //this.init_args = args;
            
            for (const [key, value] of Object.entries(this.config_file_args)) {
                args[key] = value;
            }
        }
        this.type = "base"

        this.label = defaultArg(args.label, "Base Server");
        this.dir = defaultArg(args.dir, this.label);
        this.start_command = defaultArg(args.start_command, "");
        this.cwd = defaultArg(args.cwd, "./env/");

        this.max_console_entries = defaultArg(args.max_console_entries, 5000);
        
        this.download_urls = defaultArg(args.download_urls, []);
        
        this.console_output = [];
        this.err_output = [];

        this.server_port;
        
        this.spawn;

        this.is_server_ready = false;
        this.is_in_err = false;
        this.server_status = SERVER_STATUS.STOPPED("Loaded at startup");

        
    }

    /**
     * Set Server status (Should use SERVER_STATUS class)
     * @param {*} value SERVER_STATUS instance
     */
    setServerStatus(value) {
        this.server_status = value;
    }

    SetServerReady(value) {
        this.is_server_ready = value;
    }

    SetServerError(value) {
        this.is_in_err = value;
    }


    /**
     * Check if the server is ready.
     * Note: Should be overridden to provide logic
     * @param {*} data Normally console entry
     */
    checkServerReady(data) {
        this.setServerStatus(SERVER_STATUS.RUNNING("Base Server: Server Ready"));
    }

    /** 
     * Returns a promise which is only resolved when the server is ready.
     * @returns Promise
     */
    async waitUntilServerReady() {
        //TODO: Add maximum wait time to avoid full program stall
        return new Promise((resolve) => {
            let inter = setInterval(() => {
                if (this.server_status.equals(SERVER_STATUS.LOADING()) == false) {
                    clearInterval(inter);
                    resolve(this.server_status);
                }
            }, 500);
        });
    }

    /**
     * Wait until Server status changed
     * @returns 
     */
    async waitUntilStatusChanged() {
        //TODO: Add maximum wait time to avoid full program stall
        return new Promise((resolve) => {
            const first_status = this.server_status;
            let inter = setInterval(() => {
                if (this.server_status.equals(first_status) == false) {
                    clearInterval(inter);
                    resolve(this.server_status);
                }
            }, 500);
        });
    }

    /**
     * Returns command to be run in the shell.
     * Note: Needs to be overridden 
     * @returns Command string
     */
    startCommand() {
        return undefined;
    }

    /**
     * Create basic folder structure for the server 
     */
    createFolderStructure() {
        //TODO: Maybe make this a Promise to avoid errors
        fs.mkdirSync(path.resolve(`${settings.base_game_dir}/${this.dir}`));
        fs.mkdirSync(path.resolve(`${settings.base_game_dir}/${this.dir}/env`));
    }

 
    /**
     * Save current config file to default location
     * @param {*} pass_setts 
     */
    saveConfigFile(pass_setts = {}) {
        //TODO: Allow for exporting to abstract location
        //TODO: Make sync to avoid errors
        let setts = {};
        setts.type = this.type;
        setts.label = this.label;
        setts.dir = this.dir;
        setts.cwd = this.cwd;
        setts.max_console_entries = this.max_console_entries;
        setts.download_urls = this.download_urls;
        setts.server_port = this.server_port;

        let final_setts = Object.assign({}, setts, pass_setts);

        const f = fs.openSync(path.resolve(`${settings.base_game_dir}/${this.dir}/nimba-config.json`), "w");
        fs.writeSync(f, JSON.stringify(final_setts, undefined, " "));
    }

    /**
     * Some servers require a first run to generate files and stuff
     * Note: Should be overriden
     * @returns Promise
     */
    firstRun() {
        return new Promise(async (resolve, reject) => {
            resolve();
        });
    }

    /**
     * When the server downloads files override this to set configs dynamically
     * Note: Should be overriden
     * @returns 
     */
    postFileDownloadLogic() {
        return;
    }

    /**
     * Download files in 'download_urls' into the enviroment
     * @returns Promise
     */
    downloadFiles(reply_wrapper = null) {
        return new Promise((resolve, reject) => {
            this.download_urls.forEach(async (value) => {
                console.log("Downloading : " + value);
                const basename = path.basename(value);

                const downloadFile = (async (url, out_path) => {
                    const res = await fetch(url);
                    const headers = res.headers;
                    const possible_file_name = headers.get("content-disposition");
                    const total_file_size = headers.get("content-length");
                    const test_ext = path.extname(out_path);

                    if (test_ext == "" && possible_file_name != undefined) {
                        const new_name_matches = /filename="(.+)"/gm.exec(possible_file_name);
                        if (new_name_matches.length < 2) {
                            //nope
                        } else {
                            const replace_filename_match = /\/|\\[a-zA-Z0-9]+$/gm;
                            out_path = path.resolve(out_path.replace(replace_filename_match, "/" + new_name_matches[1]));
                        }
                    }
                    
                    const fileStream = fs.createWriteStream(out_path);
                    await new Promise((resolve, reject) => {
                        res.body.pipe(fileStream);
                        res.body.on("error", reject);
                        fileStream.on("finish", resolve);
                    });
                });

                await downloadFile(value , path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}/${basename}`))
                console.log("Download Completed");
                await this.postFileDownloadLogic(path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}/${basename}`), reply_wrapper)

                resolve();
                
            });
        });

        
        //return promise;
        
    }

    /**
     * Init all files for a newly created Server
     * @returns promise
     */
    initFileSystem(reply_wrapper = null) {
        //TODO: Do checks and return info if files already exist
        return new Promise(async (resolve, reject) => {
            if (!fs.existsSync(path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}`))) {
                if (reply_wrapper != null) reply_wrapper.update("Creating Folder Structure...");
                this.createFolderStructure();
                if (reply_wrapper != null) reply_wrapper.update_line(/$/gm, "\:white_check_mark:");
                if (reply_wrapper != null) reply_wrapper.update("Downloading files... (this could take a while)");
                await this.downloadFiles(reply_wrapper);
                

                this.server_port = getAvaliblePort();
                this.saveConfigFile();
                savePerms(path.resolve(`${settings.base_game_dir}/${this.dir}`));
                if (reply_wrapper != null) reply_wrapper.update_line(/$/gm, "\:white_check_mark:");
                if (reply_wrapper != null) reply_wrapper.update("Performing first run...");
                const first_run_result = await this.firstRun();
                
                resolve();
            } else {
                reject("A folder with that name already exists");
            }
        });
    }

    /**
     * Push a string to console output.
     * Also calls checkServerReady to set server status.
     * @param {*} data 
     */
    pushToConsole(data) {
        this.console_output.push(data);
        if (this.console_output.length > 5000) {
            this.console_output = this.console_output.shift()
        }
        //TODO: Avoid pointless calls if server is already ready
        this.checkServerReady(data.toString());

    }

    /**
     * Push an error string to err_output and console_output(TODO) 
     * @param {*} data Console string line
     */
    pushErrToConsole(data) {
        this.err_output.push(data.trim());
        if (this.console_output.length > 5000) {
            this.err_output = this.err_output.shift()
        }
    }

    /**
     * Listener for stdout
     * @param {*} data 
     */
    spawn_listener_stdout_func(data) {
        console.log(`Child Process: STDOUT: ${data}`);
        this.pushToConsole(data.toString());
        
    }

    /**
     * Listener for stderr (Servers sometimes don't use this)
     * @param {*} data 
     */
    spawn_listener_stderr_func(data) {
        console.log(`Child Process: STDERR: ${data}`);
        this.SetServerError(true);
        this.pushErrToConsole(data.toString());
    }

    /**
     * Listener for spawn error (normally called when server crashes)
     * @param {*} error 
     */
    spawn_listener_error_func(error) {
        console.log(`Child Process: ERROR: ${error.message}`);
        this.SetServerError(true);
        this.pushErrToConsole(data.toString());
    }

    /**
     * Listener when spawn is closed 
     * @param {*} exit_code 
     */
    spawn_listener_close_func(exit_code) {
        console.log(`Child Process: EXITED: code ${exit_code}`);
        this.setServerStatus(SERVER_STATUS.STOPPED(`Server closed with exit code '${exit_code}'`));
        this.spawn = undefined;
    }


    /**
     * Write a line to stdin of spawn.
     * Use writeToSpawnAndGetResponse instead to get a response
     * @param {*} message 
     */
    writeToSpawn(message) {
        //TODO catch for no spawn
        if (this.spawn != undefined) this.spawn.stdin.write(message + "\n");
    }

    /**
     * Write a line to stdin and get response
     * Note: Captures responce with time listener so response maynot be reliable
     * @param {*} message Message to send to stdin
     * @param {*} capture_ms How long to wait for response
     * @returns Promise with response data
     */
    writeToSpawnAndGetResponse(message, capture_ms = 500) {
        return new Promise(async (resolve, reject) => {
            if (this.spawn == undefined) {
                reject(); 
                return;
            } 
            //TODO catch for no spawn
            this.spawn.stdin.write(message + "\n");

            let sp = this.spawn;
            let outData = [];
            
            const listener = (data) => {
                //console.log("listener enabled");
                outData.push(data.toString())

            }
            //console.log("Adding Listener");
            this.spawn.stdout.on("data", listener);
            //spawn().stdout.lis
            //Get all data in the next capture_ms
            let timeout = setTimeout(() => {
                sp.stdout.removeListener("data", listener);
                //console.log("Listener Disabled");
                resolve(outData);
            }, capture_ms);
            
        });
        
    }

    /**
     * Init default spawn listeners
     */
    init_spawn_listeners() {
        // this.spawn.stdout.on("data", this.Spawn_stdout_func);
        this.spawn.stdout.on("data", data => {
            this.spawn_listener_stdout_func(data);
        });
        
        this.spawn.stderr.on("data", data => {
            this.spawn_listener_stderr_func(data)
        });
        
        this.spawn.on('error', data => {
            this.spawn_listener_error_func(data)
        });
        
        this.spawn.on("close", data => {
            this.spawn_listener_close_func(data)
        });
    }

    /**
     * Start the server with startCommand, doesnt return any fail or success info
     * @returns 
     */
    start() {
        //TODO: Clean input to avoid malicious 
        const start_command = this.startCommand();
        if (this.cwd == undefined ||
            this.cwd == "" ||
            this.cwd == null || 
            start_command == undefined ||
            start_command == "" ||
            start_command == null) {
            console.error("CWD or Start Command Cannot be null : Stoped Start")
            return;
        }
        
        let cwd_path = path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}`);
        console.log(`Starting with: '${start_command}' > cwd:'${cwd_path}'`);
        this.spawn = spawn(start_command, [], {cwd: path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}`), shell:true});
        this.init_spawn_listeners();
        this.setServerStatus(SERVER_STATUS.LOADING("Server started"));
        //spawn().stdout.on()
        
    }

    /**
     * Force the spawn instance to close (could cause data loss)
     */
    forceKill() {
        //this.spawn.kill();
        const os = require('os');
        if(os.platform() === 'win32'){
            exec('taskkill /pid ' + this.spawn.pid + ' /T /F')
        }else{
            this.spawn.kill();  
        }
        //process.kill(this.spawn.pid);
        this.setServerStatus(SERVER_STATUS.STOPPED("Server Force killed"));
        this.spawn = undefined;
    }

    /**
     * Stop the server.
     * Note: Override with per type logic to avoid dataloss
     */
    stop() {
        this.forceKill();
    }

    /**
     * Is the spawn instance launched?
     */
    GetShellStatus() {
        if (this.spawn == undefined) {
            return false;
        }
        return true;
    }

    /**
     * Get status of the server
     * @returns SERVER_STATUS instance
     */
    getStatus() {
        return this.server_status;
    }
    
    /**
     * DEPRECATED: Get server status string 
     * @returns 
     */
    async GetStatusString() {
        const statusDict = await this.GetStatus();
        let outString = "Stopped";
        if (statusDict.shell_status == true) {
            if (this.is_server_ready == true) {
                outString = "Running";

            } else {
                outString = "Loading"
            }
            
        }
        if (this.is_in_err == true && this.spawn == undefined) {
            outString = "Error"
        }
        return outString;
    }

}

module.exports = {Server};