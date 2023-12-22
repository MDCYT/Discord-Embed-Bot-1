if (process.env.ENV !== 'production') require('dotenv').config();

const Client = require('./src/client.js');
const config = require('./config.json');
global.__basedir = __dirname;

const client = new Client(config, {
	partials: ['CHANNEL'],
	intents: 130815,
	allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
});


// Initialize client
function init() {

	client.loadCommands('./src/commands');
	// client.loadSlashCommands('./src/slash');
	// client.loadButtons('./src/buttons');
	// client.loadSelectMenus('./src/selectmenus');
	// client.loadContextMenus('./src/contextmenus');
	// client.loadModals('./src/modals');
	// client.loadEvents('./src/events', client);
	client.login(client.token);
}

init();

global.__Client = client;

process.on('unhandledRejection', (err) => client.logger.error(err));