import * as Discord from 'discord.js';
import { MESSAGE_TIMEOUT_SHORT, MESSAGE_TIMEOUT_MEDIUM } from './config';
import { isNullOrUndefined, isDate } from 'util';

require('dotenv').config();
const fs = require('fs');
const path = require('path');

let Data = {};

export class Reminder {
    constructor(client) {
        client.on("ready", () => {
            console.log(`Logged in as ${client.user.tag}`);

            fs.readFile(path.join(__dirname, "..", process.env.RESOURCE_FOLDER, process.env.RESOURCE_REMINDER), (err, data) => {
                if (err) {
                    if (err.code === "ENOENT") {
                        data = {}
                    } else {
                        console.error(err);
                        return;
                    }
                } else {
                    Data = JSON.parse(data);
                }

                console.log("Reminder data loaded.");
            });
        });
        
        client.on("message", msg => {
            let command = msg.content.split(" ");
            let guildTimezone = "UTC";

            if (Data.hasOwnProperty("timezone")) {
                if (Data["timezone"].hasOwnProperty(msg.guild.id)) {
                    guildTimezone = Data["timezone"][msg.guild.id];
                }
            }

            if (command[0].toLowerCase() === process.env.COMMAND_PREFIX && command[1].toLowerCase() === "reminder" && command.length >= 3) {
                switch(command[2].toLowerCase()) {
                    case "time": {
                        if (command.length === 3) {
                            let date = this.getCurrentDateTime(guildTimezone);
                            msg.channel.send(`Time now is: ${this.getFormattedDateString(date)} ${this.getFormattedTimeString(date)} (${this.getTimezoneOffsetString(date)})`, {code: true}).then(msg => {
                                msg.delete(MESSAGE_TIMEOUT_MEDIUM);
                            }).catch(e => {
                                console.error(e);
                            });
                        }

                        break;
                    }
                    case "timezone": {
                        if (command.length === 3) {
                            let date = this.getCurrentDateTime(guildTimezone);

                            msg.channel.send(`Current timezone is: ${guildTimezone} (${this.getTimezoneOffsetString(date)})`, {code: true}).then(msg => {
                                msg.delete(MESSAGE_TIMEOUT_MEDIUM);
                            }).catch(e => {
                                console.error(e);
                            });
                        } else {
                            let timezone = command.slice(3, command.length).join(" ");

                            try {
                                let date = this.getCurrentDateTime(timezone);
                                Data["timezone"][msg.guild.id] = timezone;

                                msg.channel.send(`Timezone set to ${timezone} (${this.getTimezoneOffsetString(date)})`, {code: true}).then(msg => {
                                    msg.delete(MESSAGE_TIMEOUT_SHORT);
                                }).catch(e => {
                                    console.error(e);
                                });

                                fs.readFile(path.join(__dirname, "..", process.env.RESOURCE_FOLDER, process.env.RESOURCE_REMINDER), (err, data) => {
                                    if (err) {
                                        if (err.code === "ENOENT") {
                                            data = {}
                                        } else {
                                            console.error(err);
                                            return;
                                        }
                                    } else {
                                        data = JSON.parse(data);
                                    }

                                    if (!data.hasOwnProperty("timezone")) {
                                        data["timezone"] = {}
                                    }

                                    data["timezone"][msg.guild.id] = timezone;

                                    let json = JSON.stringify(data, null, 2);
                                    fs.writeFile(path.join(__dirname, "..", process.env.RESOURCE_FOLDER, process.env.RESOURCE_REMINDER), json, (err) => {
                                        if (err) {
                                            console.error(err);
                                            return;
                                        }

                                        console.log("Timezone saved to file");
                                    });
                                });
                            } catch (e) {
                                msg.channel.send(`Incorrect timezone!`).then(msg => {
                                    msg.delete(MESSAGE_TIMEOUT_SHORT);
                                }).catch(e => {
                                    console.error(e);
                                });
                            }
                        }

                        break;
                    }
                    default: {
                        if (command.length >= 5) {
                            let target = command[2].toLowerCase();
                            let role;

                            switch (command[2]) {
                                default: {
                                    role = msg.guild.roles.find(role => role.name.toLowerCase() === target);

                                    break;
                                }
                            }

                            if (isNullOrUndefined(role)) {
                                console.error("Invalid role");

                                return;
                            }

                            let ms = 0;
                            switch (command[3]) {
                                default: {
                                    ms = this.getTimeFromString(command[3]);
                                    if (ms === false) {
                                        console.error("Invalid time format");

                                        return;
                                    }

                                    break;
                                }
                            }

                            let author = msg.author;
                            let date = this.getCurrentDateTime(guildTimezone);
                            let reminderMsg = command.slice(4, command.length).join(" ");
                            date.setTime(date.getTime() + ms);
                            msg.channel.send(`I will remind @${role.name} at ${this.getFormattedDateString(date)} ${this.getFormattedTimeString(date)} (${this.getTimezoneOffsetString(this.getCurrentDateTime(guildTimezone))}) with message: ${reminderMsg}`, {code: true}).then(msg => {
                                setTimeout(() => {
                                    const embed = new Discord.RichEmbed()
                                        .setColor('#44DDFF')
                                        .setTitle(`Fuee~! This is a reminder!`)
                                        .addField('Created By', author.tag);

                                    msg.channel.send(`${role} ${reminderMsg}`, embed);
                                }, ms);
                            }).catch(e => {
                                console.error(e);
                            });
                        }

                        break;
                    }
                }
            }
        });
    }

    getCurrentDateTime(timezone) {
        if (isNullOrUndefined(timezone)) {
            timezone = "UTC";
        }

        return new Date(new Date().toLocaleString("en-US", {timeZone: timezone}));
    }

    getTimeFromString(time) {
        if (time.match(/^\d[hms\d]*[hms]$/gi)) {
            let symbols = "hms";
            let result = {
                h: 0,
                m: 0,
                s: 0
            };

            for (let i = 0; i < symbols.length; i++) {
                let count = time.split(symbols[i]).length - 1;

                if (count === 1) {
                    let index = time.indexOf(symbols[i]);
                    let s = "";

                    for (let j = index - 1; j >= 0; j--) {
                        if (Number.isNaN(parseInt(time[j], 10))) {
                            break;
                        } else {
                            s = time[j] + s;
                        }
                    }

                    result[symbols[i]] = parseInt(s, 10);
                } else if (count > 1) {
                    return false;
                }
            }

            let ms = result.h*60*60*1000 + result.m*60*1000 + result.s*1000;

            if (ms > 0) {
                return ms
            } else {
                return false;
            }
        }

        return false;
    }

    getFormattedTimeString(date) {
        let hh = date.getHours();
        let mm = date.getMinutes();

        if (hh < 10) {
            hh = `0${hh}`;
        }
        if (mm < 10) {
            mm = `0${mm}`;
        }

        return `${hh}:${mm}`;
    }

    getFormattedDateString(date) {
        let dd = date.getDate();
        let mm = date.getMonth() + 1;
        var yyyy = date.getFullYear();

        if (dd < 10) {
            dd = `0${dd}`;
        } 
        if (mm < 10) {
            mm = `0${mm}`;
        } 
        
        return `${dd}/${mm}/${yyyy}`;
    }

    getTimezoneOffsetString(date) {
        if (!isDate(date)) {
            return "UTC";
        }

        let utc = new Date(new Date().toLocaleString("en-US", {timeZone: "UTC"}));
        let offset = date.getHours() - utc.getHours();

        if (offset === 0) {
            return "UTC"
        } else {
            if (offset > 0) {
                return `GMT+${offset}`;
            } else {
                return `GMT${offset}`;
            }
        }
    }
}