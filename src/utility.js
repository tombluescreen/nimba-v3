
function defaultArg(value, default_value) {
    if (value == undefined || value == null) {
        return default_value;
    }
    return value;
}

function shellCommand() {

}

module.exports = {shellCommand, defaultArg};