# Nimba v3

Nimba is a server host solution with inbuilt discord intergration.

Only intended to be used by an small servers.

Your own discord secret and client need to be provided.

## Discord Config
Discord secrets are stored in `src/settings/secrets.json`, create this file and put:
```
{
    "discord": {
        "token": "<your-discord-token>",
        "client_id": "<your-discord-client-id>"
    }
}
```

## Settings.json
Settings.json is where all global settings are stored.
```
{
    "base_game_dir": "<directory-where-game-instances-are-stored>",
    "java": {
        "default_java_path": "java",
        "java_placeholders": {
            "_comment": "When a server is created "java_20" will be replaced with the path",
            "java_20": "",
            "java_18": "",
            "java_8": "C:\\Program Files\\OpenLogic\\jre-8.0.392.08-hotspot\\bin\\java.exe",
            "java_9": "",
            "java_10": "",
            "java_11": ""
        }
    },
    "_comment": "Sets the server port from this list (so you can port forward them)",
    "available_ports" : [
        {
            "port_number": "3000",
            "final_ip": "ser0.tombluescreen.dev"
        },
        {
            "port_number": "3001",
            "final_ip": "ser1.tombluescreen.dev"
        },
        {
            "port_number": "3002",
            "final_ip": "ser2.tombluescreen.dev"
        },
        {
            "port_number": "3003",
            "final_ip": "ser3.tombluescreen.dev"
        },
        {
            "port_number": "3004",
            "final_ip": "ser4.tombluescreen.dev"
        },
        {
            "port_number": "3005",
            "final_ip": "ser5.tombluescreen.dev"
        },
        {
            "port_number": "3006",
            "final_ip": "ser6.tombluescreen.dev"
        },
        {
            "port_number": "3007",
            "final_ip": "ser7.tombluescreen.dev"
        },
        {
            "port_number": "3008",
            "final_ip": "ser8.tombluescreen.dev"
        },
        {
            "port_number": "3009",
            "final_ip": "ser9.tombluescreen.dev"
        }
    ],
    "minecraft": {
        "default_java_args": "-Xmx1024M -Xms1024M",
        "default_jar_args": "nogui",
        "templates": {
            "vanilla-latest": {

            }
        }
    },
    "_comments2": "Permissions added to every server at creation",
    "discord_permission_default": {
        
        "discord": {
            
            "group_whitelist": {
             "1187086501775937637": {
              "allowed_commands": [
               "all"
              ],
              "disallowed_commands": []
             }
            }
           }
    }

}
```