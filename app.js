if (process.env.ENV !== 'production') require('dotenv').config();

const Client = require('./src/client.js');
const {PermissionsBitField, IntentsBitField} = require("discord.js")
const config = require('./config.json');
global.__basedir = __dirname;

const client = new Client(config, {
	intents: [
		IntentsBitField.Flags.MessageContent,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessageReactions,
		IntentsBitField.Flags.GuildEmojisAndStickers,
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.GuildWebhooks,
		IntentsBitField.Flags.GuildPresences,
	]
});


// Initialize client
function init() {
	client.logger.info("initing...")
	client.loadCommands('./src/commands');
	client.loadSlashCommands('./src/slash');
	// client.loadButtons('./src/buttons');
	// client.loadSelectMenus('./src/selectmenus');
	// client.loadContextMenus('./src/contextmenus');
	// client.loadModals('./src/modals');
	 client.loadEvents('./src/events', client);
	client.login(client.token);
}

init();

global.__Client = client;

process.on('unhandledRejection', (err) => client.logger.error(err));
