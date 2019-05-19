import * as Discord from 'discord.js';
import { types } from 'util';

export class Utility {
    static onMessage(server, msg) {
        let command = msg.content.split(" ");

        if (command.length === 1) {
            msg.channel.send("https://i.imgur.com/KqoziGR.png");
        } else {
            switch(command[1]) {
                case "time": {
                    if (command.length === 2) {
                        let date = Utility.currentDateTime(server.data.timezone);
                        const embed = new Discord.RichEmbed()
                            .setColor('#44DDFF')
                            .setTitle(`It's ${Utility.formattedTimeString(date)} right now!`)
                            .setFooter(`${date.toDateString()} (${Utility.timezoneOffsetString(date)})`);
                        msg.channel.send(embed);
                    }

                    break;
                }
                case "timezone": {
                    if (command.length === 2) {
                        let date = Utility.currentDateTime(server.data.timezone);
                        const embed = new Discord.RichEmbed()
                            .setColor('#44DDFF')
                            .setDescription(`Current timezone is: ${server.data.timezone} (${Utility.timezoneOffsetString(date)})`);
                        msg.channel.send(embed);
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

                        msg.channel.send(embed);
                    }

                    break;
                }
            }
        }
    }

    static currentDateTime(timezone) {
        if (timezone === null || timezone === undefined) {
            timezone = "UTC";
        }
    
        return new Date(new Date().toLocaleString("en-US", {timeZone: timezone}));
    }
    
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
    
    static formattedDateString(date) {
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
    
    static timezoneOffsetString(date) {
        if (!types.isDate) {
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
}