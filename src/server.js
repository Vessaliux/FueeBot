import * as Discord from 'discord.js';
import { MESSAGE_TIMEOUT_SHORT, MESSAGE_TIMEOUT_MEDIUM } from './config';
import { Admin } from './admin';
import { Reminder } from './reminder';
import { Utility } from './utility';
import { Info } from './info';

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
        this._everyoneRole = this.guild.roles.find(role => role.name === "@everyone");

        console.log(`Loaded data for: ${this.guild.name} (${this.guild.id})`);

        if (!this.data.hasOwnProperty("admin")) {
            this.data["admin"] = {};
        }

        if (!this.data.admin.hasOwnProperty("global")) {
            this.data.admin["global"] = false;
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
    get everyoneRole() {return this._everyoneRole;}

    /******************************************************************************************************
    * Helper
    ******************************************************************************************************/

    isAdmin(msg) {
        return msg.member.hasPermission("ADMINISTRATOR") || msg.author.id === process.env.BOT_OWNER;
    }

    isAllowedChannel(msg) {
        return this.data.admin.global || this.data.admin.channels.hasOwnProperty(msg.channel.id);
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

    readJSONAsync(func) {
        fs.readFile(path.join(__dirname, "..", process.env.RESOURCE_FOLDER, `${this.guild.id}.json`), (err, data) =>  {
            if (err && err.code !== "ENOENT") {
                console.error(err);
                process.exit(1);
            }

            this._data = JSON.parse(data);
            func();
        });
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
            let deleteFlag = false;

            // check for command prefix
            if (command[0] !== process.env.COMMAND_PREFIX) {
                return;
            }

            // admin commands
            if (command[1] === "admin" && this.isAdmin(msg)) {
                Admin.onMessage(this, msg);
            }
            // reminder commands
            else if (command[1] === "reminder" && (this.isAdmin(msg) || this.isAllowedChannel(msg))) {
                Reminder.onMessage(this, msg);
            }
            // utility commands
            else if (this.isAdmin(msg) || this.isAllowedChannel(msg)) {
                Utility.onMessage(this, msg);
                
                if (this.data.hasOwnProperty("info")) {
                    Info.onMessage(this, msg);
                }
            } else {
                deleteFlag = false;
            }

            if (deleteFlag && this.guild.me.hasPermission("MANAGE_MESSAGES")) {
                msg.delete();
            }
    }
}