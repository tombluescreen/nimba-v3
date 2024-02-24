const { Server } = require("./server.js");

const settings = require("../settings/settings.json");

class SteamCMD extends Server {
    constructor(args) {
        super(args);

        if (settings.steam_cmd_path == undefined) {
            console.log("steamcmd path is not defined");
        }
    }
}