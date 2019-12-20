import * as Discord from 'discord.js';
import { Server } from './server';

export class Info {
    /**
     * @param {Server} server
     * @param {Discord.Message} msg
     */
    static onMessage(server, msg) {
        let client;
        if (server instanceof Server) {
            client = server.client;
        } else if (server instanceof Discord.Client) {
            client = server;
        } else {
            return;
        }

        let command = msg.content.split(" ");

        if (command.length >= 2 && command[1].toLowerCase() === "uno") {
            let arr = ["<:Jebaited:302181297349197824>", "<:RufusLaugh:443290739787563008>", "<:Mari:440765691289665537>"]

            msg.channel.send(arr[Math.floor(Math.random() * arr.length)]).catch(() => { });
        }

        if (command.length < 3) {
            return;
        }

        if (command.length <= 4) {
            let hero = command[1].toLowerCase();

            if (command.length >= 3 && Server.SharedData.info.gck.hasOwnProperty(hero)) {
                let skill = command[2].toLowerCase();
                let isLB = false;

                if (command.length === 4) {
                    if (command[2].toLowerCase() === "lb") {
                        skill = command[3].toLowerCase();
                        isLB = true;
                    } else if (command[3].toLowerCase() === "lb") {
                        isLB = true;
                    } else {
                        return;
                    }
                }

                switch (skill) {
                    case "passive":
                    case "pas": {
                        skill = "passive";
                        break;
                    }
                    case "skill_1":
                    case "skill1":
                    case "s1": {
                        skill = "skill_1";
                        break;
                    }
                    case "skill_2":
                    case "skill2":
                    case "s2": {
                        skill = "skill_2";
                        break;
                    }
                    case "ultimate":
                    case "ult": {
                        skill = "ultimate";
                        break;
                    }
                    case "special":
                    case "spe": {
                        skill = "special";
                        break;
                    }
                    case "chaser":
                    case "cha":
                    case "chaser_skill":
                    case "cs": {
                        skill = "chaser";
                        break;
                    }
                    default: {
                        return;
                    }
                }

                if (!Server.SharedData.info.gck[hero].hasOwnProperty(skill)) {
                    return;
                }

                let lbSkill = `lb_${skill}`;
                if (isLB && !Server.SharedData.info.gck[hero].hasOwnProperty(lbSkill)) {
                    return;
                }

                const embed = new Discord.RichEmbed().setColor(Server.SharedData.info.gck[hero].color);

                if (isLB) {
                    embed.setThumbnail(Server.SharedData.info.gck[hero][lbSkill].icon);

                    if (Server.SharedData.info.gck[hero][lbSkill].hasOwnProperty(`name`)) {
                        embed.addField(`Name`, `**[Enhanced] ${Server.SharedData.info.gck[hero][lbSkill].name}**`, true);
                    } else {
                        embed.addField(`Name`, `**[Enhanced] ${Server.SharedData.info.gck[hero][skill].name}**`, true);
                    }

                    if (Server.SharedData.info.gck[hero][skill].hasOwnProperty(`cast_time`)) {
                        embed.addField(`Cast Time`, `${Server.SharedData.info.gck[hero][skill].cast_time}s`, true);
                    } else {
                        embed.addBlankField(true);
                    }

                    embed.addField(`Type`, `${Server.SharedData.info.gck[hero][skill].type}\n\u200b`, true);

                    if (Server.SharedData.info.gck[hero][lbSkill].hasOwnProperty(`cooldown`)) {
                        embed.addField(`Cooldown`, `${Server.SharedData.info.gck[hero][lbSkill].cooldown}s`, true);
                    } else if (Server.SharedData.info.gck[hero][skill].hasOwnProperty(`cooldown`)) {
                        embed.addField(`Cooldown`, `${Server.SharedData.info.gck[hero][skill].cooldown}s`, true);
                    }

                    embed.addField(`Description`, Server.SharedData.info.gck[hero][lbSkill].description);
                } else {
                    embed.setThumbnail(Server.SharedData.info.gck[hero][skill].icon)
                        .addField(`Name`, `**${Server.SharedData.info.gck[hero][skill].name}**`, true);

                    if (Server.SharedData.info.gck[hero][skill].hasOwnProperty(`cast_time`)) {
                        embed.addField(`Cast Time`, `${Server.SharedData.info.gck[hero][skill].cast_time}s`, true);
                    } else {
                        embed.addBlankField(true);
                    }

                    embed.addField(`Type`, `${Server.SharedData.info.gck[hero][skill].type}\n\u200b`, true);

                    if (Server.SharedData.info.gck[hero][skill].hasOwnProperty(`cooldown`)) {
                        embed.addField(`Cooldown`, `${Server.SharedData.info.gck[hero][skill].cooldown}s`, true);
                    }

                    if (skill === "chaser") {
                        embed.addField(`Description`, `${Server.SharedData.info.gck[hero][skill].description}\n\u200b`);
                        embed.addField(`L-Upgrade`, `${Server.SharedData.info.gck[hero][skill]["upgrade-l"]}\n\u200b`);
                        embed.addField(`R-Upgrade`, Server.SharedData.info.gck[hero][skill]["upgrade-r"]);
                    } else {
                        embed.addField(`Description`, Server.SharedData.info.gck[hero][skill].description);
                    }
                }

                let translatedById = null;

                if (isLB && Server.SharedData.info.gck[hero][lbSkill].hasOwnProperty("translated_by")) {
                    translatedById = Server.SharedData.info.gck[hero][lbSkill].translated_by;
                } else if (!isLB && Server.SharedData.info.gck[hero][skill].hasOwnProperty("translated_by")) {
                    translatedById = Server.SharedData.info.gck[hero][skill].translated_by;
                } else if (Server.SharedData.info.gck[hero].hasOwnProperty(`translated_by`)) {
                    translatedById = Server.SharedData.info.gck[hero].translated_by;
                }

                if (translatedById === null) {
                    msg.channel.send(embed).catch(() => { });
                } else {
                    (async () => {
                        try {
                            const user = await client.fetchUser(translatedById);
                            embed.setFooter(`Translated by ${user.tag}`, user.avatarURL);
                            msg.channel.send(embed).catch(() => { });
                        } catch (err) {
                            console.error(err);
                        }
                    })();
                }
            }
        }
    }
}