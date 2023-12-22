const settings = require("../settings/settings.json");

/*
This file handles avalible ports defined in settings
*/

function getAllDefinedPorts() {
    return settings.available_ports;
}

function getAllUsedPorts() {
    const usedPortList = [];
    for (let i = 0; i < global.server_list.length; i++) {
        const openServer = global.server_list[i];
        const serverPort = openServer.server_port;
        usedPortList.push(serverPort);
    }
    return usedPortList;
}

function getAvaliblePort() {
    const usedPorts = getAllUsedPorts();
    const definedPorts = getAllDefinedPorts();

    let avaliblePorts = [];

    for (let i = 0; i < definedPorts.length; i++) {
        let openPort = definedPorts[i];
        let foundPort = false;
        for (let j = 0; j < usedPorts.length; j++) {
            
            if (openPort == usedPorts[j]) {
                foundPort = true;
            }
            
        }

        if (foundPort == false) {
            avaliblePorts.push(openPort);
        }
    }
    return avaliblePorts[0];
}

module.exports = { getAvaliblePort };