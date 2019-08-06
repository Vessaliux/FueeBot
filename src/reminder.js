import * as Discord from 'discord.js';
import { Server } from './server';
import { Utility } from './utility';

require('dotenv').config();

export class Reminder {
    static onMessage(server, msg) {
        let command = msg.content.split(" ");

        if (command.length < 3) {
            return;
        }

        function getReminderEmbed() {
            if (!server.data.reminder.hasOwnProperty(msg.author.id) || server.data.reminder[msg.author.id].length === 0) {
                return false;
            }

            let embed = new Discord.RichEmbed().setColor('#44DDFF');
            let s = ``;

            for (let i = 0; i < server.data.reminder[msg.author.id].length; i++) {
                let reminder = server.data.reminder[msg.author.id][i];
                let date = new Date(reminder.scheduledDate);
                s += `${i + 1}) ${Utility.formattedTimeString(date)} ${Utility.formattedDateString(server, date)} *(${Utility.timezoneOffsetString(Utility.currentDateTime(server.data.timezone))})*, to ${reminder.targetString} with **${reminder.text}**\n`
            }

            embed.addField(`${msg.author.tag} Reminder List`, s);

            return embed;
        }

        switch(command[2].toLowerCase()) {
            case "list": {
                if (command.length != 3) {
                    return;
                }

                let embed = getReminderEmbed();

                if (embed === false) {
                    embed = new Discord.RichEmbed().setColor('#44DDFF');
                    embed.setDescription("You have no reminders set.");
                }

                msg.channel.send(embed).catch(() => {});

                break;
            }
            case "delete": {
                if (command.length != 3) {
                    return;
                }

                let embed = getReminderEmbed();

                if (embed === false) {
                    embed = new Discord.RichEmbed().setColor('#44DDFF');
                    embed.setDescription("You have no reminders set.");
                    msg.channel.send(embed).catch(() => {});

                    return;
                }

                let author = msg.author;
                msg.channel.send("Select number to delete", embed).then(msg => {
                    let emojiList = [];
                    for (let i = 0; i < server.data.reminder[author.id].length; i++) {
                        if (i > 8) {
                            break;
                        }

                        emojiList.push(Utility.getEmoji(i + 1));
                    }

                    function reactTask() {
                        if (emojiList.length > 0) {
                            msg.react(emojiList.shift()).then(reactTask).catch(() => {});
                        }
                    }
                    msg.react(emojiList.shift()).then(reactTask).catch(() => {});

                    const filter = (reaction, user) => {
                        let bool = false;

                        for (let i = 0; i < server.data.reminder[author.id].length; i++) {
                            if (i > 8) {
                                break;
                            }
    
                            bool = bool || reaction.emoji.name === Utility.getEmoji(i + 1);
                        }

                        return bool && user.id === author.id;
                    }
                    msg.awaitReactions(filter, {max: 1, time: 20000, errors: ["time"]}).then(collected => {
                        let key = collected.keys().next().value;
                        let index = Utility.getEmojiKey(key) - 1;

                        clearTimeout(server.memoryData.reminder[author.id][index]);
                        server.data.reminder[author.id].splice(index, 1);
                        server.memoryData.reminder[author.id].splice(index, 1);
                        server.writeJSON();

                        embed = new Discord.RichEmbed().setColor('#44DDFF');
                        embed.setDescription("Reminder deleted.");
                        msg.channel.send(embed).catch(() => {});
                        msg.delete();
                    }).catch(collected => {
                        msg.delete();
                    });
                }).catch(() => {});

                break;
            }
            case "me": {
                if (command.length < 5) {
                    return;
                }

                let target = msg.author;

                // check if user exists
                if (target === null || target === undefined) {
                    return;
                }

                let ms = 0;
                ms = Utility.timeFromString(command[3].toLowerCase());
                if (ms === false) {
                    return;
                }

                let reminder = {
                    author: {
                        id: msg.author.id,
                        tag: msg.author.tag,
                        avatarURL: msg.author.avatarURL
                    },
                    type: "user",
                    targets: [msg.author.id],
                    targetString: `@${msg.author.tag}`,
                    text: command.slice(4, command.length).join(" ")
                }

                this.sendReminder(server, msg.channel, reminder, ms);

                break;
            }
            case "role": {
                if (command.length < 6) {
                    return;
                }

                let target = command[3].toLowerCase();
                let role = server.guild.roles.find(role => role.name.toLowerCase() === target);

                // check if role exists
                if (role === null || role === undefined) {
                    return;
                }

                let ms = 0;
                ms = Utility.timeFromString(command[4].toLowerCase());
                if (ms === false) {
                    return;
                }

                let reminder = {
                    author: {
                        id: msg.author.id,
                        tag: msg.author.tag,
                        avatarURL: msg.author.avatarURL
                    },
                    type: "role",
                    targets: [role.id],
                    text: command.slice(5, command.length).join(" ")
                }
                reminder["targetString"] = "";
                let roles = [role];
                for (let role of roles) {
                    reminder.targetString += `@${role.name}, `;
                }
                reminder.targetString = reminder.targetString.slice(0, -2);

                this.sendReminder(server, msg.channel, reminder, ms);

                break;
            }
        }
    }

    /**
     * @param {Server} server
     * @param {Discord.TextChannel} channel
     * @param {Object} reminder,
     * @param {Number} ms,
     * @param {Boolean} toWrite
     */
    static sendReminder(server, channel, reminder, ms, toWrite = true) {
        let author = reminder.author;
        let date = Utility.currentDateTime(server.data.timezone);
        let time = date.getTime() + ms;
        date.setTime(time);

        reminder["timestamp"] = new Date().getTime();
        reminder["channel"] = channel.id;
        reminder["scheduledDate"] = date;
        reminder["scheduledTime"] = reminder.timestamp + ms;

        if (!server.data.reminder.hasOwnProperty(author.id)) {
            server.data.reminder[author.id] = [];
        }

        if (!server.memoryData.reminder.hasOwnProperty(author.id)) {
            server.memoryData.reminder[author.id] = [];
        }

        function task() {
            let timer = setTimeout(() => {
                const embed = new Discord.RichEmbed()
                    .setColor('#44DDFF')
                    .addField("Fuee~! This is a reminder!", reminder.text)
                    .setFooter(`Created by ${author.tag}`, author.avatarURL);
                let targetText = "";
                
                for (let target of reminder.targets) {
                    let targetObj;
                    switch (reminder.type) {
                        case "role": {
                            targetObj = server.guild.roles.get(target);

                            break;
                        }
                        default: {
                            targetObj = server.guild.members.get(target).user;

                            break;
                        }
                    }

                    targetText += `${targetObj} `;
                }

                channel.send(targetText, embed).catch(() => {});

                let i = 0;
                for (i = 0; i < server.data.reminder[author.id].length; i++) {
                    let currReminder = server.data.reminder[author.id][i];

                    if (reminder.timestamp === currReminder.timestamp) {
                        break;
                    }
                }

                server.data.reminder[author.id].splice(i, 1);
                server.memoryData.reminder[author.id].splice(i, 1);
                server.writeJSON();
            }, ms);

            if (toWrite) {
                if (server.data.reminder[author.id].length === 0) {
                    server.data.reminder[author.id].push(reminder);
                    server.memoryData.reminder[author.id].push(timer);
                } else {
                    let index;
    
                    for (index = 0; index < server.data.reminder[author.id].length; index++) {
                        let currReminder = server.data.reminder[author.id][index];
    
                        if (reminder.scheduledTime === currReminder.scheduledTime) {
                            if (reminder.timestamp <= currReminder.timestamp) {
                                break;
                            }
                        } else if (reminder.scheduledTime < currReminder.scheduledTime) {
                            break;
                        }
                    }
    
                    server.data.reminder[author.id].splice(index, 0, reminder);
                    server.memoryData.reminder[author.id].splice(index, 0, timer);
                }
    
                server.writeJSON();
            } else {
                server.memoryData.reminder[author.id].push(timer);
            }
        }

        if (toWrite) {
            const embed = new Discord.RichEmbed()
            .setColor('#44DDFF')
            .addField("Recipient", reminder.targetString, true)
            .addField("Type", reminder.type.toProperCase(), true)
            .addField("Remind At", `${Utility.formattedTimeString(reminder.scheduledDate)} ${Utility.formattedDateString(server, reminder.scheduledDate)} *(${Utility.timezoneOffsetString(Utility.currentDateTime(server.data.timezone))})*`)
            .addField("Message", reminder.text)
            .setFooter(`Created by ${author.tag}`, author.avatarURL);
            channel.send("Fuee~! Reminder created!", embed).then(task).catch(() => {});
        } else {
            task();
        }
    }

    /**
     * @param {Server} server
     * @param {Object} reminder,
     * @param {Number} ms
     */
    static reformReminder(server, reminder, ms) {
        let channel = server.guild.channels.get(reminder.channel);

        if (channel) {
            Reminder.sendReminder(server, channel, reminder, ms, false);
        } else {
            console.error("Reminder.reformReminder: Invalid channel id");
        }
    }
}