const fs = require("fs");
const path = require("path");

const settings = require("../settings/settings.json");

const { Server } = require('./server.js');
const { defaultArg } = require("../utility.js");


class Minecraft extends Server {
    constructor(args) {
        super(args);
        args = this.init_args;

        this.type = "minecraft";
        this.java_path = defaultArg(args.java_path, "java");
        this.java_args = defaultArg(args.java_args, "");
        this.jar_path = defaultArg(args.jar_path, "");
        this.jar_args = defaultArg(args.jar_args, "nogui");
    }

    CheckServerReady(str) {
        const re = /Done \([0-9]*\.[0-9]*s\).*"help"/gm;
        let test_response = re.test(str);
        if (test_response == true) {
            this.SetServerReady(true);
            //console.log("Server Ready!!!!");
        }
    }

    StartCommand() {
        let com = `"${this.java_path}" ${this.java_args} -jar "${this.jar_path}" ${this.jar_args}`;
        return com;
    }

    TestFuncTWO() {
        super.TestFuncTWO();
        console.log("FUNC TWO ++++++++++++++");
    }

    AcceptEULA() {
        const f = fs.openSync(path.resolve(`${settings.base_game_dir}/${this.dir}/${this.cwd}/eula.txt`), "w");
        fs.writeSync(f, "eula=true"); 
    }

    InitConfigFile(pass_setts = {}) {
        let setts = {};

        setts.java_path = this.java_path;
        setts.java_args = this.java_args;
        setts.jar_path = this.jar_path;
        setts.jar_args = this.jar_args;

        let final_setts = Object.assign({}, setts, pass_setts);

        super.InitConfigFile(final_setts);
    }

    FirstRun() {
        return new Promise((resolve, reject) => {
            this.AcceptEULA()
            resolve();
        })
        
    }

    async GetMCPlayerCountFromShell() {
        if (this.is_server_ready == false) {
            return false;
        }
        let res = await this.WriteToSpawnAndGetResponse("list", 1000);
        const player_count_regex = /There are ([0-9]+) of a max of ([0-9]+) players online:/gm;
        let match_res = player_count_regex.exec(res[0]); //Todo: Doesnt account for random data in res
        if (match_res == null) {
            return false;
        }
        const player_count = match_res[1];
        const player_max = match_res[2];

        return [player_count, player_max];
    }

    async GetStatus() {

        let playercountshell = await this.GetMCPlayerCountFromShell(); 

        return {
            shell_status: this.GetShellStatus(),
            player_count: playercountshell,
            mc_ip_status: null,
        }
        
    }

}

module.exports = { Minecraft };