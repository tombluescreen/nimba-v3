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
        this.java_args = defaultArg(args.java_path, "");
        this.jar_path = defaultArg(args.java_path, "");
        this.jar_args = defaultArg(args.java_path, "nogui");
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

        setts.java_path = this.jar_path;
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

}

module.exports = {Minecraft};