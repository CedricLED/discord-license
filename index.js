const Discord = require('discord.js');
const config = require('./config.js');
const request = require('request-promise');
const schedule = require('node-schedule');

// Creating the discord client
const client = new Discord.Client();
var guild;
var category;
var offHour;
var offHourLog;

// Attaching the config to the client
client.config = config;


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}\n${client.guilds.size} servers!`);
  guild = client.guilds.get(config.guild);
  category = client.channels.get(config.supportCategory);
  offHour = client.channels.get(config.offHourCategory);
  offHourLog = client.channels.get(config.offHourLog);
  schedule.scheduleJob('0 23 * * *', function() {
    category.overwritePermissions(config.supportRoleID, {
      'VIEW_CHANNEL': false
    });
    offHour.overwritePermissions(config.supportRoleID, {
      'VIEW_CHANNEL': true
    });
  });
  schedule.scheduleJob('0 5 * * *', function() {
    category.overwritePermissions(config.supportRoleID, {
      'VIEW_CHANNEL': true
    });
    offHour.overwritePermissions(config.supportRoleID, {
      'VIEW_CHANNEL': false
    });
  });
});

client.on('guildMemberAdd', (member) => {
  member.send("");
});

client.on("message", message => {
  if (message.author.bot) return;
  if (message.channel.id == config.offHourChannel) {
    if (message.attachments.size > 0) {
      offHourLog.send({
        "embed": {
          "description": message.content,
          "image": {
            "url": message.attachments.first().url,
          },
          "author": {
            "name": message.author.username,
            "icon_url": message.author.displayAvatarURL,
          },
        },
      });
    } else {
      offHourLog.send({
        "embed": {
          "description": message.content,
          "author": {
            "name": message.author.username,
            "icon_url": message.author.displayAvatarURL
          }
        }
      });
    }
    message.delete();
    return;
  }
  if (message.channel.type !== "text") {
    const options = {
      method: 'POST',
      uri: 'https://api.com/auth/verify',
      headers: {
        'content-type': 'application/json'
      },
      body: `{
        "license":"${message.content}",
        "discordUserId":"${message.author.id}",
        "discordUserName":"${message.author.username}",
        "discordUserTag":"${message.author.tag}"
    }`,
      resolveWithFullResponse: true
    };
    request(options)
      .then(function(response) {
        if (response.statusCode == 200) {
          guild.fetchMember(message.author).then((member) => {
            member.addRole(config.supportRoleID);
          });
          message.reply("You are now verified!");
        }
      })
      .catch(function(err) {
        console.log(err);
        message.reply("Invalid License Key!");
      });
  }
});

// Logging in to the client with the token
client.login(config.token);
