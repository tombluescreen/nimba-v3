const { spawn } = require("child_process");
const { Readable } = require('stream');
const fs = require("fs");
const path = require("path");
const http = require('https'); 

const settings = require("../settings/settings.json");

const { defaultArg } = require("../utility.js");

class Server {
    constructor(args) {
        this.init_args = {};
        if (args.config_file_path != undefined) {
            // load data from config file
            var data = fs.readFileSync(args.config_file_path, { encoding: 'utf8', flag: 'r' });
            args = JSON.parse(data);
            this.init_args = args;
        }
        this.type = "base"

        this.label = defaultArg(args.label, "Base Server");
        this.dir = defaultArg(args.dir, this.label);
        this.start_command = defaultArg(args.start_command, "");
        this.cwd = defaultArg(args.cwd, "./env/");

        this.max_console_entries = defaultArg(args.max_console_entries, 5000);
        
        this.download_urls = defaultArg(args.download_urls, []);
        
        this.console_output = [];
        
        this.spawn;

        this.is_server_ready = false;
    }

    SetServerReady(value) {
        this.is_server_ready = value;
    }



    CheckServerReady(data) {
        this.SetServerReady(true);
    }

    async IsServerReady() {
        return new Promise((resolve) => {
            let inter = setInterval(() => {
                if (this.is_server_ready == true) {
                    clearInterval(inter);
                    resolve();
                }
            }, 500);
        });
    }

    StartCommand() {
        return undefined;
    }

    TestFuncONE() {
        console.log("FUNC ONE");
        this.TestFuncTWO();
    }

    TestFuncTWO() {
        console.log("FUNC TWO");
    }

    CreateFolderStructure() {
        var eggs = path.resolve(`${settings.base_game_dir}/${this.dir}`);
        fs.mkdirSync(path.resolve(`${settings.base_game_dir}/${this.dir}`));
        fs.mkdirSync(path.resolve(`${settings.base_game_dir}/${this.dir}/env`));
    }

 

    InitConfigFile(pass_setts = {}) {
        let setts = {};
        setts.type = this.type;
        setts.label = this.label;
        setts.dir = this.dir;
        setts.cwd = this.cwd;
        setts.max_console_entries = this.max_console_entries;
        setts.download_urls = this.download_urls;

        let final_setts = Object.assign({}, setts, pass_setts);

        const f = fs.openSync(path.resolve(`${settings.base_game_dir}/${this.dir}/nimba-config.json`), "w");
        fs.writeSync(f, JSON.stringify(final_setts, undefined, " "));
    }

    FirstRun() {
        return new Promise(async (resolve, reject) => {
            resolve();
        });
    }

    DownloadFiles() {
        return new Promise((resolve, reject) => {
            this.download_urls.forEach((value) => {
                console.log("Downloading : " + value);
                const basename = path.basename(value);
                const outFile = fs.createWriteStream(path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}/${basename}`))
                const request = http.get(value, (response) => {
                    response.pipe(outFile);
    
                    outFile.on("finish", () => {
                        outFile.close();
                        console.log("Download Completed");
                        resolve();
                    });
                })
            });
        });

        
        //return promise;
        
    }

    InitFileSystem() {
        return new Promise(async (resolve, reject) => {
            if (!fs.existsSync(path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}`))) {
                this.CreateFolderStructure();
                this.InitConfigFile();

                await this.DownloadFiles();

                await this.FirstRun();
                resolve();
            }
            
        });
        
    }

    PushToConsole(data) {
        this.console_output.push(data);
        if (this.console_output.length > 5000) {
            this.console_output = this.console_output.shift()
        }
        this.CheckServerReady(data.toString());

    }

    Spawn_stdout_func(data) {
        console.log(`Child Process: STDOUT: ${data}`);
        this.PushToConsole(data.toString());
    }

    Spawn_stderr_func(data) {
        console.log(`Child Process: STDERR: ${data}`);
    }

    Spawn_error_func(error) {
        console.log(`Child Process: ERROR: ${error.message}`);
    }

    Spawn_close_func(exit_code) {
        console.log(`Child Process: EXITED: code ${exit_code}`);
    }

    WriteToSpawn(message) {
        //TODO catch for no spawn
        const s = new Readable();
        s.push(message);
        s.push(null);

        s.pipe(this.spawn.stdin);
        this.spawn.stdout.on("data", data => {

        });
    }

    WriteToSpawnAndGetResponse(message, capture_ms = 500) {
        return new Promise(async (resolve, reject) => {
            //TODO catch for no spawn
            const s = new Readable();
            s.push(message);
            s.push(null);

            s.pipe(this.spawn.stdin);

            let sp = this.spawn;
            let outData = [];
            
            function listener(data) {
                //console.log(data.toString());
                outData.push(data.toString())
            }
            //console.log("Adding Listener");
            this.spawn.stdout.on("data", listener);
            
            //Get all data in the next capture_ms
            let timeout = setTimeout(() => {
                sp.stdout.removeListener("data", listener);
                resolve(outData);
            }, capture_ms);
            
        });
        
    }

    Init_spawn_listeners() {
        // this.spawn.stdout.on("data", this.Spawn_stdout_func);
        this.spawn.stdout.on("data", data => {
            this.Spawn_stdout_func(data);
        });
        
        this.spawn.stderr.on("data", this.Spawn_stderr_func);
        
        this.spawn.on('error', this.Spawn_error_func);
        
        this.spawn.on("close", this.Spawn_close_func);
    }

    Start() {
        if (this.cwd == undefined ||
            this.cwd == "" ||
            this.cwd == null || 
            this.StartCommand() == undefined ||
            this.StartCommand() == "" ||
            this.StartCommand() == null) {
            console.error("CWD or Start Command Cannot be null : Stoped Start")
            return;
        }
        let startCommand = this.StartCommand();
        let cwd_path = path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}`)
        this.spawn = spawn(this.StartCommand(), [], {cwd: path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}`), shell:true});
        this.Init_spawn_listeners();
        //spawn().stdout.on()
        
    }

    ForceKill() {
        this.spawn.kill('SIGINT');
    }

    Stop() {
        this.ForceKill();
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

    async GetStatus() {
        return {shell_status: this.GetShellStatus()}
    }
    
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
        return outString;
    }

}

module.exports = {Server};