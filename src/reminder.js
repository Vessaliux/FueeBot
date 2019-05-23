import * as Discord from 'discord.js';
import { Utility } from './utility';

require('dotenv').config();
const fs = require('fs');
const path = require('path');

let ReminderData = {};

export class Reminder {
    static onMessage(server, msg) {
        let command = msg.content.split(" ");

        if (!ReminderData.hasOwnProperty(server.guild.id)) {
            ReminderData[server.guild.id] = [];
        }

        switch(command[2].toLowerCase()) {
            case "list": {
                if (command.length == 3) {
                    const embed = new Discord.RichEmbed().setColor('#44DDFF');
                    
                    if (ReminderData[server.guild.id].hasOwnProperty(msg.author.id) && ReminderData[server.guild.id][msg.author.id].length > 0) {
                        let s = ``;

                        for (let i = 0; i < ReminderData[server.guild.id][msg.author.id].length; i++) {
                            let reminder = ReminderData[server.guild.id][msg.author.id][i];
                            let date = new Date(reminder.scheduled);
                            s += `${i + 1}) ${Utility.formattedTimeString(date)} *(${Utility.formattedDateString(date)} ${Utility.timezoneOffsetString(Utility.currentDateTime(server.data.timezone))})*, to ${reminder.target} with **${reminder.text}**\n`
                        }

                        embed.addField(`${msg.author.tag} Reminder List`, s);
                    } else {
                        embed.setDescription("You have no reminders set.")
                    }

                    msg.channel.send(embed).catch(() => {});
                }

                break;
            }
            case "role": {
                if (command.length >= 6) {
                    let target = command[3].toLowerCase();
                    let role = server.guild.roles.find(role => role.name.toLowerCase() === target);
                    const embed = new Discord.RichEmbed().setColor('#44DDFF');

                    if (role === null || role === undefined) {
                        embed.setDescription(`Invalid role.`);
                        msg.channel.send(embed).catch(() => {});

                        return;
                    }

                    let ms = 0;
                    ms = Utility.timeFromString(command[4].toLowerCase());
                    if (ms === false) {
                        embed.setDescription(`Invalid time format.`);
                        msg.channel.send(embed).catch(() => {});

                        return;
                    }

                    let author = msg.author;
                    let date = Utility.currentDateTime(server.data.timezone);
                    let time = date.getTime() + ms;

                    if (!ReminderData[server.guild.id].hasOwnProperty(author.id)) {
                        ReminderData[server.guild.id][author.id] = [];
                    }

                    let reminder = {
                        target: `@${role.name}`,
                        timestamp: new Date().getTime(),
                        scheduled: time,
                        text: command.slice(5, command.length).join(" ")
                    }

                    date.setTime(time);
                    embed.setDescription(`I will remind role @${role.name} at ${Utility.formattedTimeString(date)} *(${Utility.formattedDateString(date)} ${Utility.timezoneOffsetString(Utility.currentDateTime(server.data.timezone))})* with message: **${reminder.text}**`)
                    msg.channel.send(embed).then(msg => {
                        reminder["timer"] = setTimeout(() => {
                            const embed = new Discord.RichEmbed()
                                .setColor('#44DDFF')
                                .setTitle(`Fuee~! This is a reminder!`)
                                .addField('Created By', author.tag);
                            msg.channel.send(`${role} ${reminder.text}`, embed).catch(() => {});

                            let i = 0;
                            for (i = 0; i < ReminderData[server.guild.id][author.id].length; i++) {
                                let currReminder = ReminderData[server.guild.id][author.id][i];

                                if (reminder.timestamp === currReminder.timestamp) {
                                    break;
                                }
                            }

                            ReminderData[server.guild.id][author.id].splice(i, 1);
                        }, ms);

                        if (ReminderData[server.guild.id][author.id].length === 0) {
                            ReminderData[server.guild.id][author.id].push(reminder);
                        } else {
                            let index;

                            for (index = 0; index < ReminderData[server.guild.id][author.id].length; index++) {
                                let currReminder = ReminderData[server.guild.id][author.id][index];

                                if (reminder.scheduled === currReminder.scheduled) {
                                    if (reminder.timestamp <= currReminder.timestamp) {
                                        break;
                                    }
                                } else if (reminder.scheduled < currReminder.scheduled) {
                                    break;
                                }
                            }

                            ReminderData[server.guild.id][author.id].splice(index, 0, reminder);
                        }
                    }).catch(e => {
                        console.error(e);
                    });
                }

                break;
            }
        }
    }
}