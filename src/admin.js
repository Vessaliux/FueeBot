import * as Discord from 'discord.js';

const fs = require('fs');
const path = require('path');

export class Admin {
    static onMessage(server, msg) {
        let command = msg.content.split(" ");

        if (command.length < 3) {
            return;
        }

        switch (command[2].toLowerCase()) {
            case "reload": {
                server.readJSONAsync(() => {
                    const embed = new Discord.RichEmbed()
                        .setColor(`#44DDFF`)
                        .setDescription(`Successfully reloaded data.`);
                    msg.channel.send(embed);
                });

                break;
            }
            case "enableglobal":
            case "eblglobal": {
                const embed = new Discord.RichEmbed().setColor("#44DDFF")

                if (server.data.admin.global) {
                    embed.setDescription(`Global mode is already enabled.`);
                } else {
                    embed.setDescription(`Global mode has been **enabled**.`);
                    server.data.admin.global = true;
                    server.writeJSON();
                }

                msg.channel.send(embed);

                break;
            }
            case "disableglobal":
            case "dblglobal": {
                const embed = new Discord.RichEmbed().setColor("#44DDFF")

                if (!server.data.admin.global) {
                    embed.setDescription(`Global mode is already disabled.`);
                } else {
                    embed.setDescription(`Global mode has been **disabled**.`);
                    server.data.admin.global = false;
                    server.writeJSON();
                }

                msg.channel.send(embed);

                break;
            }
            case "channels":
            case "chn": {
                if (command.length > 3) {
                    return;
                }

                const embed = new Discord.RichEmbed().setColor("#44DDFF")
                let keys = Object.keys(server.data.admin.channels);

                if (server.data.admin.global) {
                    embed.setTitle("Global mode is enabled!")
                }

                if (keys.length === 0) {
                    embed.setDescription(`No channels in the allowed list.`);
                } else {
                    let s = "";

                    keys.sort();
                    for (let channel of keys) {
                        s += `<#${channel}>\n`;
                    }

                    s += "";
                    embed.addField("Allowed channels:", s);
                }

                msg.channel.send(embed)

                break;
            }
            case "setchannel":
            case "setchn": {
                if (command.length < 4) {
                    return;
                }
                
                const embed = new Discord.RichEmbed().setColor("#44DDFF")
                let channel = command.slice(3, command.length).join(" ").replace(/<|#|>/g, "");

                if (server.data.admin.channels.hasOwnProperty(channel)) {
                    embed.setDescription(`**<#${channel}>** is already an allowed channel.`);
                } else if (server.guild.channels.some(chn => chn.id === channel)) {
                    server.data.admin.channels[channel] = true;
                    server.writeJSON();

                    if (server.data.admin.global) {
                        embed.setTitle("Global mode is enabled!")
                    }

                    embed.setDescription(`Added **<#${channel}>** to the allowed channel list.`);
                } else {
                    embed.setDescription(`Invalid channel.`);
                }

                msg.channel.send(embed)

                break;
            }
        }
    }
}