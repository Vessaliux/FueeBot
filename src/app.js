require('dotenv').config();
import Discord from 'discord.js';
import { Server } from './server';
import { Utility } from './utility';
import { Info } from './info';

const fs = require('fs');
const path = require('path');
const client = new Discord.Client();

/******************************************************************************************************
* Prototypes
******************************************************************************************************/

String.prototype.toProperCase = function () {
    return this.toLowerCase().replace(/(?:^|[\s-/])\w/g, function (match) {
        return match.toUpperCase();
    });
}

/******************************************************************************************************
* Data Initialization
******************************************************************************************************/

// check for resource folder, create if it doesn't exist
let dir = path.join(__dirname, "..", process.env.RESOURCE_FOLDER);
fs.exists(dir, (exists) => {
    if (!exists) {
        fs.mkdir(dir, (err) => {
            if (err) {
                console.error(err);
                return;
            }

            console.log("Resource folder created.");
        })
    }
});

// map to store data server instances
let ServerMap = new Map();

/******************************************************************************************************
* Event Handlers
******************************************************************************************************/

// bot login
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}\n`);

    client.user.setActivity("Fuee~");

    console.log("Reading and loading data..");
    (async () => {
        let awaits = [];
        for (let guild of client.guilds.array()) {
            awaits.push(await ServerMap.set(guild, new Server(client, guild)));
        }

        Promise.all(awaits).then(() => {
            console.log("All data loaded.\n");
        });
    })();
});

// message by any user
client.on("message", msg => {
    switch (msg.channel.type) {
        // is a DM
        case 'dm':
            if (Server.SharedData.hasOwnProperty("info")) {
                Info.onMessage(client, msg);
            }

            break;
        // in a server text channel
        case 'text':
            if (ServerMap.has(msg.guild)) {
                ServerMap.get(msg.guild).onMessage(msg);
            }
            break;
    }


});

// joins a new guild
client.on("guildCreate", guild => {
    // not in the server previously
    if (!ServerMap.has(guild)) {
        ServerMap.set(guild, new Server(client, guild));
    }
});

// leaves a guild
client.on("guildDelete", guild => {
    // delete server data
    if (ServerMap.has(guild)) {
        ServerMap.delete(guild);
        console.log(`Left: ${this.guild.name} (${this.guild.id})`);
    }
});

client.login(process.env.BOT_TOKEN_DEV).catch(() => {
    
});
//client.login(process.env.BOT_TOKEN);