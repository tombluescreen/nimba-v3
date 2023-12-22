
function defaultArg(value, default_value) {
    if (value == undefined || value == null || value == "") {
        return default_value;
    }
    return value;
}

function checkDownloadURL(url) {
    const allowed_domains = [
        "forgecdn.net",
        "mojang.com",
        "modpacks.ch"
    ]
}

function truncStringToSize(string, char_count) {
    let newString = string;
    if (string.length > char_count) {
        newString = string.substring(0, char_count-4) + "..."
        
    }
    return newString;
}

module.exports = { defaultArg, checkDownloadURL, truncStringToSize};