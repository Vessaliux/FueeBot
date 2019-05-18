require('dotenv').config();
import * as Discord from 'discord.js';
import { Reminder } from './reminder';

const fs = require('fs');
const path = require('path');

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

const client = new Discord.Client();
new Reminder(client);

client.login(process.env.BOT_TOKEN_DEV);