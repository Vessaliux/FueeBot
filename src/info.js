import * as Discord from 'discord.js';

export class Info {
    static onMessage(server, msg) {
        let command = msg.content.split(" ");

        if (command.length < 3) {
            return;
        }

        if (command.length <= 4) {
            let hero = command[1].toLowerCase();
            
            if (command.length >= 3 && server.data.info.hasOwnProperty(hero)) {
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
                    default: {
                        return;
                    }
                }

                if (!server.data.info[hero].hasOwnProperty(skill)) {
                    return;
                }

                let lbSkill = `lb_${skill}`;
                if (isLB && !server.data.info[hero].hasOwnProperty(lbSkill)) {
                    return;
                }

                const embed = new Discord.RichEmbed().setColor(server.data.info[hero].color);

                if (isLB) {
                    embed.setThumbnail(server.data.info[hero][lbSkill].icon);

                    if (server.data.info[hero][lbSkill].hasOwnProperty(`name`)) {
                        embed.addField(`Name`, `[Enhanced] ${server.data.info[hero][lbSkill].name}`, true);
                    } else {
                        embed.addField(`Name`, `[Enhanced] ${server.data.info[hero][skill].name}`, true)
                    }

                    if (server.data.info[hero][skill].hasOwnProperty(`cast_time`)) {
                        embed.addField(`Cast Time`, `${server.data.info[hero][skill].cast_time}s`, true)
                    } else {
                        embed.addBlankField(true)
                    }
                    
                    embed.addField(`Type`, `${server.data.info[hero][skill].type}\n\u200b`, true);

                    if (server.data.info[hero][lbSkill].hasOwnProperty(`cooldown`)) {
                        embed.addField(`Cooldown`, `${server.data.info[hero][lbSkill].cooldown}s`, true);
                    } else if (server.data.info[hero][skill].hasOwnProperty(`cooldown`)) {
                        embed.addField(`Cooldown`, `${server.data.info[hero][skill].cooldown}s`, true);
                    }

                    embed.addField(`Description`, server.data.info[hero][lbSkill].description);
                } else {
                    embed.setThumbnail(server.data.info[hero][skill].icon)
                        .addField(`Name`, server.data.info[hero][skill].name, true)
                        
                    if (server.data.info[hero][skill].hasOwnProperty(`cast_time`)) {
                        embed.addField(`Cast Time`, `${server.data.info[hero][skill].cast_time}s`, true)
                    } else {
                        embed.addBlankField(true)
                    }

                    embed.addField(`Type`, `${server.data.info[hero][skill].type}\n\u200b`, true);

                    if (server.data.info[hero][skill].hasOwnProperty(`cooldown`)) {
                        embed.addField(`Cooldown`, `${server.data.info[hero][skill].cooldown}s`, true);
                    }

                    embed.addField(`Description`, server.data.info[hero][skill].description);
                }

                if (server.data.info[hero].hasOwnProperty(`translated_by`)) {
                    server.client.fetchUser(server.data.info[hero].translated_by).then(user => {
                        embed.setFooter(`Translated by ${user.tag}`, user.avatarURL);
                        msg.channel.send(embed).catch(() => {});
                    }).catch(err => {
                        console.error(err);
                    })
                } else {
                    msg.channel.send(embed).catch(() => {});
                }
            }
        }
    }
}