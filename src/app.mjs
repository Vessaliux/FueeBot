require('dotenv').config();
import * as Discord from 'discord.js';
import { Server } from './server';

const fs = require('fs');
const path = require('path');
const client = new Discord.Client();

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

    console.log("Reading and loading data..");
    for (let guild of client.guilds.array()) {
        ServerMap.set(guild, new Server(client, guild));
    }
    console.log("All data loaded.\n");
});

// message by any user
client.on("message", msg => {
    // in a server
    if (ServerMap.has(msg.guild)) {
        ServerMap.get(msg.guild).onMessage(msg);
    }
});

client.login(process.env.BOT_TOKEN_DEV);