import { Client, Intents } from 'discord.js';
import { createRequire } from "module";
import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
const require = createRequire(import.meta.url);
const logger = require('winston');
const auth = require('./auth.json');
const cron = require('cron');

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use JSON file for storage
const file = join(__dirname, 'db.json')
const adapter = new JSONFile(file)
const db = new Low(adapter)

// Read data from JSON file, this will set db.data content
await db.read()

// If file.json doesn't exist, db.data will be null
// Set default data

/*
structure: {
servers: [ serverID: {categoryID: ******, reactChannel: ******, pingChannel: ******, pingerID: *******, pingedID: ******, messages: [] } ],
canDM: [userid1: [servers], userid2: [servers], ...],
  (if people are in neither, when someone tries to schedule a message, check with user to place in category.
   if user no longer has servers in can or cant DM then remove from db)
cantDM: [userid1: [servers], userid2: [servers], ...],
scheduledMessages: [ userID: {messages: [{time: ******, message: ******}]}]
}
*/
db.data ||= {
              servers: {},
              acceptedUsers: {},
              scheduledMessages: {}
            };

db.write();
// Globals as needed

const helpString = "Commands and descriptions to be added";
const reactionMessage = "Reactions and descriptions to be added";

// ***** Basic Startup Stuff ***** \\

  // Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

  // Initialize Discord Bot
var bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES,
                                 Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                                 Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS] });

bot.on('ready', () => {
    logger.info('Connected at: ' + bot.readyAt);
    logger.info('Logged in as: ' + bot.user.username + ' - (' + bot.user.id + ')');
});

// ***** End Basic Startup Stuff ***** \\

//==================================================================\\

//==================================================================\\

// ***** Main Bot Logic ***** \\

// setup data to be used in db, send message on how to setup bot
bot.on('guildCreate', async (guild) => {
  // create server entry with empty pieces in db
  let entry = {};

  // send message in main channel about setup info
  if(typeof guild.systemChannel !== "undefined" && guild.systemChannel !== null) {
    guild.systemChannel.send({content: helpString});
  } else {
    bot.users.createDM(guild.ownerId).then( channel => {
      channel.send({content: helpString});
    });
  }

  // fill server entry in db
  entry = await setupServer(guild);

  // add entry to db
  db.data.servers[guild.id] = entry;
  db.write();
});

// remove all data about the guild from db
bot.on('guildDelete', async (guild) => {
  let serverData = db.data.servers[guild.id];

  // remove server from can/cantDM user list

  // remove any users that no longer have any servers in can/cantDM list

  // remove scheduled messages by users that were just removed

  // fully remove server entry from db
});

// User message event
bot.on('messageCreate', (message) => {

  if (message.content.substring(0, 1) == '-') {

    let user = message.author.id;
    let server = message.guildId || null;
    let guild = message.guild || null;
    let isPinger = false;
    let pingerID = null;
    let pingedID = null;
    let pingChannel = null;

    if(server != null) {
      let roles = message.member.roles.cache;
      // get and set ping variables from db for this server

      for(const role of roles) {
        if(role.id == pingerID) {
          isPinger = true;
        }
      }
    }

    var args = message.content.substring(1).split(' ');
    var cmd = args[0];

    args = args.splice(1);
    switch(cmd) {


      case 'announce':

      if(message.author.id == auth.fatherID)
      {
        var details = message.content.substring(cmd.length + 1);

        announce(details);
      }

      break;

      case 'removeBot':

      if(guild != null) {
        if(message.author.id === guild.ownerId) {
          let serverData = db.data.servers[guild.id];

          // remove channels and roles
          guild.channels.cache.get(serverData.categoryID).delete("Cleaning up before leaving");
          guild.channels.cache.get(serverData.reactChannel).delete("Cleaning up before leaving");
          guild.channels.cache.get(serverData.pingChannel).delete("Cleaning up before leaving");

          guild.roles.delete(serverData.pingerID, "Cleaning up before leaving");
          guild.roles.delete(serverData.pingedID, "Cleaning up before leaving");

          guild.leave();
        }
      }

      break;

      case 'addPing':
      if(isPinger) {
        let thing = message.content.substring(cmd.length + 1);
        let quote = '@everyone' + thing + '\n';
      }


      break;

      case 'removePing':

      fs.rm('quotes.txt', (err) => {
        if (err)
        {
          message.reply({content: 'might be able to try again, go for it'});
        }
        else
        {
          console.log(args[0]);
          quotes.splice(args[0], 1);
          console.log(quotes);

          for(let string in quotes)
          {
            fs.appendFile('quotes.txt', quotes[string] + '\n', (err) =>{
              if(err)
              {
                message.reply({content: 'stuff is messed up, have fun fixing it'});
              }
            });
          }
          message.reply({content: 'things worked, woooooo'});
        }
      });

      break;

      case 'displayPings':

      message.reply({content: 'remember remove index starts at 0'});
      message.reply({content: quotes});

      break;


    }
  }
});

let scheduledMessage = new cron.CronJob('00 00 13 * * *', () => {
  bot.channels.fetch('844203570801672254').then( channel => {
    channel.send({content: quotes[getRandomInt(quotes.length)]});
  });
});

// When you want to start it, use:
scheduledMessage.start()

// ***** End Main Bot Logic ***** \\

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

async function announce(message)
{
  var servers = bot.guilds.cache;

  //console.log(servers);

  servers.forEach(server =>
  {
    server.systemChannel.send({content: "@everyone " + message});
  });
}

async function setupServer(guild) {

  let entry = {};

  // create role for getting server messages
  let pingedData = await guild.roles.create({
    name: "The pinged",
    color: "RED",
    reason: "Role needed for bot operations"
  });

  // create role for setting server messages
  let pingerData = await guild.roles.create({
    name: "The pingers",
    color: "RED",
    reason: "Role needed for bot operations"
  });

  let categoryData = await guild.channels.create("Messenger Channels", {
    type: "GUILD_CATEGORY",
    reason: "Category to use for role allocation by bot"
  });


  // create react roles channel
  let reactData = await categoryData.createChannel("react-roles", {reason: "channel to use for role allocation by bot"});
  reactData.send({content: reactionMessage});

  // create server message channel
  let pingData = await categoryData.createChannel("server-messages", {reason: "channel to use for messaging by bot"});

  entry = {
    categoryID: categoryData.id,
    pingChannel: pingData.id,
    reactChannel: reactData.id,
    pingerID: pingerData.id,
    pingedID: pingedData.id,
    messages: []
  };

  return entry;
}

function scheduleMessage(message, time) {

}

function makeCronString(month, day, hour, minute, second, interval, intervalFor) {

}

// log in

bot.login(auth.botToken);
