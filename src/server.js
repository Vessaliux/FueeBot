import * as Discord from 'discord.js';
import { MESSAGE_TIMEOUT_SHORT, MESSAGE_TIMEOUT_MEDIUM } from './config';
import { Admin } from './admin';
import { Reminder } from './reminder';
import { Utility } from './utility';
import { Info } from './info';

require('dotenv').config();
const fs = require('fs');
const path = require('path');

function readSharedJSON() {
    try {
        let data = {};
        data["utility"] = JSON.parse(fs.readFileSync(path.join(__dirname, "..", process.env.RESOURCE_SHARED_FOLDER, `utility.json`)));
        data["info"] = {};
        data["info"]["gck"] = JSON.parse(fs.readFileSync(path.join(__dirname, "..", process.env.RESOURCE_SHARED_FOLDER, `info_gck.json`)));

        console.log("Global data loaded.\n");

        return data;
    } catch(err) {
        if (err.code === "ENOENT") {
            return {};
        }

        console.error(err);
        process.exit(1);
    }
}

let SharedData = readSharedJSON();

function readSharedJSONAsync(func) {
    fs.readFile(path.join(__dirname, "..", process.env.RESOURCE_SHARED_FOLDER, `utility.json`), (err, data) =>  {
        if (err && err.code !== "ENOENT") {
            console.error(err);
            process.exit(1);
        }

        delete SharedData["utility"];
        SharedData["utility"] = JSON.parse(data);

        func();
    });

    fs.readFile(path.join(__dirname, "..", process.env.RESOURCE_SHARED_FOLDER, `info_gck.json`), (err, data) =>  {
        if (err && err.code !== "ENOENT") {
            console.error(err);
            process.exit(1);
        }

        delete SharedData["info"]["gck"];
        SharedData["info"]["gck"] = JSON.parse(data);

        func();
    });
}

// Represents Discord server
export class Server {
    /******************************************************************************************************
    * Core
    ******************************************************************************************************/

    /**
     * @param {Discord.Client} msg
     * @param {Guild} guild
     */
    constructor(client, guild) {
        this._client = client;
        this._guild = guild;
        this._memoryData = {};
        this._data = this.readJSON();

        console.log(`Loaded data for: ${this.guild.name} (${this.guild.id})`);

        this.memoryData["reminder"] = {};

        if (!this.data.hasOwnProperty("admin")) {
            this.data["admin"] = {};
        }

        if (!this.data.admin.hasOwnProperty("global")) {
            this.data.admin["global"] = true;
        }

        if (!this.data.admin.hasOwnProperty("channels")) {
            this.data.admin["channels"] = {};
        }

        if (!this.data.hasOwnProperty("timezone")) {
            this.data["timezone"] = "UTC";
        }

        if (!this.data.hasOwnProperty("reminder")) {
            this.data["reminder"] = {};
        } else {
            let timestamp = new Date().getTime();
            let deleteIndices = [];

            for (let key in this.data.reminder) {
                for (let i = 0; i < this.data.reminder[key].length; i++) {
                    let ms = this.data.reminder[key][i].scheduledTime - timestamp;
    
                    if (ms >= 0) {
                        Reminder.reformReminder(this, this.data.reminder[key][i], ms);
                    } else {
                        deleteIndices.push(i);
                    }
                }

                for (let index of deleteIndices) {
                    delete this.data.reminder[key].splice(index, 1);
                }
            }
        }
    }

    /** 
     * @type {Discord.Client} 
     * */
    get client() {return this._client;}
    
    /** 
     * @type {Discord.Guild} 
     * */
    get guild() {return this._guild;}
    
    /** 
     * @type {Object} 
     * */
    get data() {return this._data;}

    /** 
     * @type {Object} 
     * */
    get memoryData() {return this._memoryData;}

    /** 
     * @type {Object} 
     * */
    static get SharedData() {return SharedData;}

    /******************************************************************************************************
    * Helper
    ******************************************************************************************************/

    /**
     * @param {Discord.Message} msg
     * @return {Boolean}
     */
    isDeveloper(msg) {
        return msg.author.id === process.env.BOT_OWNER;
    }

    /**
     * @param {Discord.Message} msg
     * @return {Boolean}
     */
    isAdmin(msg) {
        return msg.member.hasPermission("ADMINISTRATOR") || msg.author.id === process.env.BOT_OWNER;
    }

    /**
     * @param {Discord.Message} msg
     * @return {Boolean}
     */
    isAllowedChannel(msg) {
        return this.data.admin.global || this.data.admin.channels.hasOwnProperty(msg.channel.id);
    }

    /**
     * @param {Promise} promise
     * @param {Number} timeout
     */
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

    /**
     * @param {Function} func
     */
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
    * Event Action
    ******************************************************************************************************/

    /**
     * @param {Discord.Message} msg
     */
    onMessageFunc(msg) {
        // double safety
        if (msg.member === undefined || msg.member === null) {
            console.error(`Error (msg.member): double safety.`);

            return;
        }

        /** @type {String} */ let command = msg.content.split(" ");
        /** @type {Boolean} */ let deleteFlag = false;
        
        // check for command prefix
        if (command[0] !== process.env.COMMAND_PREFIX) {
            return;
        }    

        // developer commands
        if (command[1] === "dev" && msg.author.id === process.env.BOT_OWNER) {
            if (command.length === 4 && command[2] === "reload" && command[3] === "global") {
                let readCount = 0;
                readSharedJSONAsync(() => {
                    readCount++;

                    if (readCount == 2) {
                        const embed = new Discord.RichEmbed().setColor(`#44DDFF`)
                            .setDescription(`Successfully reloaded shared data.`);

                        msg.channel.send(embed).catch(() => {})
                    }
                });
            }
        }
        // admin commands
        else if (command[1] === "admin" && this.isAdmin(msg)) {
            Admin.onMessage(this, msg);
        }
        // reminder commands
        else if (command[1] === "reminder" && (this.isAdmin(msg) || this.isAllowedChannel(msg))) {
            Reminder.onMessage(this, msg);
        }
        // utility commands
        else if (this.isAdmin(msg) || this.isAllowedChannel(msg)) {
            Utility.onMessage(this, msg);
            
            if (Server.SharedData.hasOwnProperty("info")) {
                Info.onMessage(this, msg);
            }
        } else {
            deleteFlag = false;
        }

        if (deleteFlag && this.guild.me.hasPermission("MANAGE_MESSAGES")) {
            msg.delete();
        }
    }

    /******************************************************************************************************
    * Events
    ******************************************************************************************************/

    /**
     * @param {Discord.Message} msg
     */
    onMessage(msg) {
        // refuse webhooks
        if (msg.webhookID) {
            return;
        }

        // safety check
        if (this.guild.me === undefined || this.guild.me === null) {
            console.error(`guild.me null: ${this.guild}`);

            return;
        }

        // cache not available, manually fetch member
        if (msg.member === undefined || msg.member === null) {
            if (msg.author === undefined || msg.author === null) {
                return;
            }

            this.guild.fetchMember(msg.author).then(member => {
                msg.member = member;
                this.onMessageFunc(msg);
            }).catch(err => {
                console.error(err);
            });

            return;
        }

        this.onMessageFunc(msg);
    }
}