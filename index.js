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
servers: [ serverID: {channelID: ******, pingerRoleID: ******* pingedRoleID: ******, messages: [] } ],
canDM: [userid1, userid2, ...],
scheduledMessages: [ userID: {messages: [{time: ******, message: ******}]}]
}
*/
db.data ||= {
              servers: [],
              acceptedUsers: [],
              scheduledMessages: []
            };

// Globals as needed


// ***** Basic Startup Stuff ***** \\

  // Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

  // Initialize Discord Bot
var bot = new Discord.Client();

bot.on('ready', () => {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

// ***** End Basic Startup Stuff ***** \\

//==================================================================\\

//==================================================================\\

// ***** Main Bot Logic ***** \\

// User message event
bot.on('message', (message) => {

    if (message.content.substring(0, 1) == '-') {

      let user = message.author.id;
      let server = message.guildId || null;
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

        case 'addPing':
        if(server != null) {
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

function scheduleMessage(message, time) {

}

// log in

bot.login(auth.botToken);
