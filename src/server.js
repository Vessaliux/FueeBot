import * as Discord from 'discord.js';
import { MESSAGE_TIMEOUT_SHORT, MESSAGE_TIMEOUT_MEDIUM } from './config';
import { Admin } from './admin';
import { Reminder } from './reminder';
import { Utility } from './utility';

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Represents Discord server
export class Server {
    /******************************************************************************************************
    * Core
    ******************************************************************************************************/

    constructor(client, guild) {
        this._client = client;
        this._guild = guild;
        this._data = this.readJSON();

        console.log(`Loaded data for: ${this.guild.name} (${this.guild.id})`);

        if (!this.data.hasOwnProperty("admin")) {
            this.data["admin"] = {};
        }

        if (!this.data.admin.hasOwnProperty("channels")) {
            this.data.admin["channels"] = {};
        }

        if (!this.data.hasOwnProperty("timezone")) {
            this.data["timezone"] = "UTC";
        }
    }

    get client() {return this._client;}
    get guild() {return this._guild;}
    get data() {return this._data;}

    /******************************************************************************************************
    * Helper
    ******************************************************************************************************/

    isAdmin(msg) {
        return msg.member.hasPermission("ADMINISTRATOR") || msg.author.id === process.env.BOT_OWNER;
    }

    deleteMessage(promise, timeout = MESSAGE_TIMEOUT_SHORT) {
        promise.then(msg => {
            msg.delete(timeout);
        }).catch(err => {
            console.error(err);
        });
    }

    readJSON() {
        try {
            let data = fs.readFileSync(path.join(__dirname, "..", process.env.RESOURCE_FOLDER, `${this.guild.id}.json`));
            
            return JSON.parse(data);
        } catch(err) {
            if (err.code === "ENOENT") {
                return {};
            }

            console.error(err);
            process.exit(1);
        }
    }

    writeJSON() {
        let json = JSON.stringify(this.data, null, 2);

        fs.writeFile(path.join(__dirname, "..", process.env.RESOURCE_FOLDER, `${this.guild.id}.json`), json, (err) => {
            if (err) {
                console.error(err);
                return;
            }
        });
    }

    /******************************************************************************************************
    * Events
    ******************************************************************************************************/

    onMessage(msg) {
        let command = msg.content.split(" ");

        if (command[0] !== process.env.COMMAND_PREFIX) {
            return;
        }

        // admin commands
        if (command[1] === "admin" && this.isAdmin(msg)) {
            Admin.onMessage(this, msg);
        }
        // reminder commands
        else if (command[1] === "reminder" && this.isAdmin(msg) || this.data.admin.channels.hasOwnProperty(msg.channel.id)) {
            Reminder.onMessage(this, msg);
        }
        // utility commands
        else if (this.isAdmin(msg) || this.data.admin.channels.hasOwnProperty(msg.channel.id)) {
            Utility.onMessage(this, msg);
        }
    }
}