import * as Discord from 'discord.js';
import { Server } from './server';
import { types } from 'util';

const Emojis = {
    1: "1⃣",
    2: "2⃣",
    3: "3⃣",
    4: "4⃣",
    5: "5⃣",
    6: "6⃣",
    7: "7⃣",
    8: "8⃣",
    9: "9⃣"
}

/*const COOLDOWN = 5 * 60;
const BACKFIRE_DURATION = 60;
let SnapCooldown = {};
setInterval(() => {
    for (let id in SnapCooldown) {
        if (SnapCooldown[id] > 0) {
            SnapCooldown[id] -= 1;
        } else {
            SnapCooldown[id] = 0
        }
    }
}, 1000);*/

export class Utility {
    /**
     * @param {Server} server
     * @param {Discord.Message} msg
     */
    static onMessage(server, msg) {
        let command = msg.content.split(" ");

        if (command.length === 1) {
            msg.channel.send(Server.SharedData.utility.fuee[Math.floor(Math.random() * Server.SharedData.utility.fuee.length)]).catch(() => {});
        } else {
            switch(command[1].toLowerCase()) {
                /*case "snap": {
                    if (command.length === 2 && server.guild.id === "81392063312044032") {
                        let member = server.guild.members.get("215081584955621376"); // Omen
                        let role = server.guild.roles.find(role => role.name === "Thanos Snapped");

                        if (member.roles.has(role.id)) {
                            msg.channel.send(`<:Bruh:562338181316608020> **${member.displayName}** is already snapped.`).catch(() => {});

                            return;
                        }

                        if (!server.isDeveloper(msg) && msg.member.id !== member.id) {
                            if (!SnapCooldown.hasOwnProperty(msg.author.id)) {
                                SnapCooldown[msg.author.id] = 0;
                            }

                            if (SnapCooldown[msg.author.id] === 0) {
                                SnapCooldown[msg.author.id] = COOLDOWN;
                            } else {
                                const embed = new Discord.RichEmbed()
                                    .setColor('#44DDFF')
                                    .setDescription(`Chill **${msg.member.displayName}**. You still need to wait ${SnapCooldown[msg.author.id]} seconds.`);
                                msg.channel.send(embed).catch(() => {});

                                return;
                            }
                        }
                        let seconds = 30;
                        let roll = 90;
                        let backfire = 5;

                        if (role && member) {
                            let random = Utility.getRandomInt(0, 100);
                            let text = `**${msg.member.displayName}** rolled ${random} out of 100. *(>=${roll} for success)*`;

                            if (random >= roll) {
                                member.addRole(role).then(() => {
                                    const embed = new Discord.RichEmbed()
                                        .setColor('#44DDFF')
                                        .setDescription(`**${member.displayName}** has been snapped for ${seconds} seconds.`);
                                    msg.channel.send(text, embed).then(msg => {
                                        setTimeout(() => {
                                            member.removeRole(role);
                                        }, seconds * 1000);
                                    }).catch(() => {});
                                }).catch(() => {});
                            } else if (random <= backfire) {
                                msg.member.addRole(role).then(() => {
                                    const embed = new Discord.RichEmbed()
                                        .setColor('#44DDFF')
                                        .setDescription(`Nice pathetic roll, **${msg.member.displayName}** has been snapped instead for ${BACKFIRE_DURATION} seconds.`);
                                    msg.channel.send(text, embed).then(() => {
                                        setTimeout(() => {
                                            msg.member.removeRole(role);
                                        }, BACKFIRE_DURATION * 1000);
                                    }).catch(() => {});
                                }).catch(() => {});
                            } else {
                                const embed = new Discord.RichEmbed()
                                    .setColor('#44DDFF')
                                    .setDescription(`**${member.displayName}** is safe... for now.`);
                                msg.channel.send(text, embed).catch(() => {});
                            }
                        }
                    }

                    break;
                }*/
                case "hakanai": 
                case "fleeting": {
                    if (command.length === 2) {
                        msg.channel.send(Server.SharedData.utility.fleeting[Math.floor(Math.random() * Server.SharedData.utility.fleeting.length)]).catch(() => {});
                    }

                    break;
                }
                case "4town": {
                    if (command.length === 2) {
                        msg.channel.send({
                             files: [{
                                attachment: './shared_resources/4Town.png',
                             }]
                          }).catch(() => {});
                    }

                    break;
                }
                case "aikeva":
                case "aik":
                case "aikss":
                case "spreadsheet": {
                    if (command.length === 2) {
                        const embed = new Discord.RichEmbed()
                            .setColor('#00ff7f')
                            .setThumbnail(`https://i.imgur.com/RhxmQdA.png`);
                        msg.channel.send("Fuee! This is the link to Aikeva's spreadsheet: https://aikeva.page.link/GCKss", embed).catch(() => {});
                    }

                    break;
                }
                case "blame":
                    if (command.length === 2) {
                        msg.channel.send(Server.SharedData.utility.blame[Math.floor(Math.random() * Server.SharedData.utility.blame.length)]).catch(() => {});
                    }

                    break;
                case "time": {
                    if (command.length === 2) {
                        let date = Utility.currentDateTime(server.data.timezone);
                        const embed = new Discord.RichEmbed()
                            .setColor('#44DDFF')
                            .setTitle(`It's ${Utility.formattedTimeString(date)} right now!`)
                            .setFooter(`${date.toDateString()} (${Utility.timezoneOffsetString(date)})`);
                        msg.channel.send(embed).catch(() => {});
                    }

                    break;
                }
                case "timezone": {
                    if (command.length === 2) {
                        let date = Utility.currentDateTime(server.data.timezone);
                        const embed = new Discord.RichEmbed()
                            .setColor('#44DDFF')
                            .setDescription(`Current timezone is: ${server.data.timezone} (${Utility.timezoneOffsetString(date)})`);
                        msg.channel.send(embed).catch(() => {});
                    } else {
                        if (!server.isAdmin(msg)) {
                            return;
                        }

                        let timezone = command.slice(2, command.length).join(" ");
                        const embed = new Discord.RichEmbed().setColor('#44DDFF');

                        try {
                            let date = Utility.currentDateTime(timezone);
                            server.data.timezone = timezone;
                            embed.setDescription(`Timezone set to ${timezone} (${Utility.timezoneOffsetString(date)}).`);
                            server.writeJSON();
                        } catch (e) {
                            embed.setDescription(`Invalid timezone.`);
                        }

                        msg.channel.send(embed).catch(() => {});
                    }

                    break;
                }
            }
        }
    }

    /**
     * @param {String} timezone
     */
    static currentDateTime(timezone) {
        if (timezone === null || timezone === undefined) {
            timezone = "UTC";
        }
    
        return new Date(new Date().toLocaleString("en-US", {timeZone: timezone}));
    }
    
    /**
     * @param {String} time
     */
    static timeFromString(time) {
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
    
            let ms = result.h*36e5 + result.m*6e4 + result.s*1000;
    
            if (ms > 0) {
                return ms
            } else {
                return false;
            }
        }
    
        return false;
    }
    
    /**
     * @param {Date} date
     */
    static formattedTimeString(date) {
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
    
    /**
     * @param {Server} server
     * @param {Date} date
     */
    static formattedDateString(server, date) {
        if (!types.isDate(date)) {
            return;
        }

        let now = new Date(new Date().toLocaleString("en-US", {timeZone: server.data.timezone}));
        let nowDay = now.getDate();
        let nowMonth = now.getMonth() + 1;
        let nowYear = now.getFullYear();
        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();

        if (nowYear === year && nowMonth === month) {
            switch (day - nowDay) {
                case -1:
                    return "Yesterday"
                case 0:
                    return "Today"
                case 1:
                    return "Tomorrow"
            }
        }
    
        if (day < 10) {
            day = `0${day}`;
        } 
        if (month < 10) {
            month = `0${month}`;
        } 
        
        return `${day}/${month}/${year}`;
    }
    
    /**
     * @param {Date} date
     */
    static timezoneOffsetString(date) {
        if (!types.isDate(date)) {
            date = new Date(new Date().toLocaleString("en-US", {timeZone: "UTC"}));
        }

        let utc = new Date(new Date().toLocaleString("en-US", {timeZone: "UTC"}));
        let offset = Math.floor((date - utc) / 36e5);
    
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

    /**
     * @param {String} emojiText
     */
    static getEmoji(emojiText) {
        if (Emojis.hasOwnProperty(emojiText)) {
            return Emojis[emojiText];
        }

        return null;
    }

    static getEmojiKey(emojiValue) {
        return Object.keys(Emojis).find(key => Emojis[key] === emojiValue);
    }

    /**
     * @param {Number} min
     * @param {Number} max
     * @return {Number}
     */
    static getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}