// noinspection JSClosureCompilerSyntax

const Discord = require('discord.js');
const {
	readdir,
	readdirSync,
} = require('fs');
const {
	join,
	resolve,
} = require('path');
const AsciiTable = require('ascii-table');
const {
	Collection,
} = require('discord.js');

const queue = new Map();
const Commands = new Collection();
const Slashes = [];
/**
 * Any Bot's custom client 
 * @extends Discord.Client
 */
class Client extends Discord.Client {
	/**
   * Create a new client
   * @param {Object} config
   * @param {{intents: intents}} options
   */
	constructor(config, options = {}) {
		super(options);
		global.Client = this;
		/**
     * Bot id
     */
		this.id = process.env.BOTID;

		/**
     * Create logger
     */
		this.logger = require('./utils/logger.js');

		/**
     * Create MongoDB
     */
		this.mongodb = require('./utils/mongodb.js');

		/**
     * All possible command types
     * @type {Object}
     */
		this.types = {
			INFO: 'info',
			FUN: 'fun',
			UTILS: 'utils',
			INTERNET: 'internet',
			VOICE: 'voice',
			ANIMALS: 'animals',
			COLOR: 'color',
			POINTS: 'points',
			LEVELS: 'levels',
			MISC: 'misc',
			GAMES: 'games',
			SOCIAL: 'social',
			MOD: 'mod',
			ADMIN: 'admin',
			MUSIC: 'music',
			BACKUP: 'backup',
			OWNER: 'owner',
			NSFW: 'nsfw',
		};

		/**
     * Collection of bot commands
     * @type {Collection<string, Command>}
     */
		this.commands = new Discord.Collection();

		/**
     * Collection of bot cooldowns
     * @type {Collection<string, Date>}
     */
		this.cooldowns = new Discord.Collection();

		/**
     * Collection of bot slashes
     * @type {Collection<string, Slash>}
     */
		this.slashes = new Discord.Collection();

		/**
     * Collection of bot buttons
     * @type {Collection<string, Button>}
     */
		this.buttons = new Discord.Collection();

		/**
     * Collection of bot selects menus
     * @type {Collection<string, Button>}
     */
		this.menus = new Discord.Collection();

		/**
     * Collection of bot modals
     * @type {Collection<string, Modal>}
     */
		this.modals = new Discord.Collection();

		/**
     * Collection of command aliases
     * @type {Collection<string, Command>}
     */
		this.aliases = new Discord.Collection();

		/**
     * Login token
     * @type {string}
     */
		this.token = process.env.TOKEN;

		/**
     * API keys
     * @type {Object}
     */
		this.apiKeys = config.apiKeys;

		/**
     * Api Url
     * @type {string}
     */
		this.apiUrl = process.env.APIURL;

		/**
     * Any Bot's owner ID
     * @type {string}
     */
		// Check if the owner ID in the config is a number
		this.ownerID = process.env.OWNERID;

		/**
     * Developer's ID
     * @type {array}
     */
		this.developerID = config.developers;

		/**
     * Any Bot's Version
     * @type {string}
     */
		const version = require(__basedir + '/package.json').version;
		this.version = version;

		/**
     * Utility functions
     * @type {Object}
     */
		this.utils = require('./utils/utils.js');

		this.logger.info('Initializing...');
	}

	/**
   * Loads all available commands
   * @param {string} path
   */
	loadCommands(path) {
		this.logger.info('Loading commands...');
		const table = new AsciiTable('Commands');
		table.setHeading('File', 'Aliases', 'Cooldown', 'Type', 'Status');
		readdirSync(path)
			.filter((f) => !f.endsWith('.js'))
			.forEach((dir) => {
				const commands = readdirSync(
					resolve(__basedir, join(path, dir)),
				).filter((f) => f.endsWith('js'));
				commands.forEach((f) => {
					const Command = require(resolve(__basedir, join(path, dir, f)));
					const command = new Command(this);
					if (command.name && !command.disabled) {
						// Map command
						this.commands.set(command.name, command);
						Commands.set(command.name, command);
						// Map command aliases
						let aliases = '';
						if (command.aliases) {
							command.aliases.forEach((alias) => {
								this.aliases.set(alias, command);
							});
							aliases = command.aliases.join(', ');
						}
						table.addRow(f, aliases, command.type, 'pass');
					}
					else {
						this.logger.warn(`${f} failed to load`);
						table.addRow(f, '', '', 'fail');
					}
				});
			});
		this.logger.info(`\n${table.toString()}`);
		return this;
	}

	/**
   * Loads all slash commands
   * @param {string} path
   */
	loadSlashCommands(path) {
		this.logger.info('Loading slash commands...');
		const table = new AsciiTable('Slash Commands');
		table.setHeading('File', 'Status');
		readdirSync(path)
			.filter((f) => !f.endsWith('.js'))
			.forEach((dir) => {
				const slashes = readdirSync(resolve(__basedir, join(path, dir))).filter(
					(f) => f.endsWith('js'),
				);
				slashes.forEach((f) => {
					const Slash = require(resolve(__basedir, join(path, dir, f)));
					const slash = new Slash(this);
					try {
						Slashes.push(slash.data.toJSON());
					}
					catch (e) {
						Slashes.push(slash.data);
					}
					this.slashes.set(slash.data.name, slash);
					table.addRow(f, 'pass');
				});
			});
		this.logger.info(`\n${table.toString()}`);
		return this;
	}

	/**
   * Loads all context menus
   * @param {string} path
   */
	loadContextMenus(path) {
		this.logger.info('Loading context menus...');
		const table = new AsciiTable('Context Menus');
		table.setHeading('File', 'Status');
		readdirSync(path)
			.filter((f) => !f.endsWith('.js'))
			.forEach((dir) => {
				const slashes = readdirSync(resolve(__basedir, join(path, dir))).filter(
					(f) => f.endsWith('js'),
				);
				slashes.forEach((f) => {
					const ContextMenu = require(resolve(__basedir, join(path, dir, f)));
					const contextMenu = new ContextMenu(this);
					try {
						Slashes.push(contextMenu.data.toJSON());
					}
					catch (e) {
						Slashes.push(contextMenu.data);
					}
					this.slashes.set(contextMenu.data.name, contextMenu);
					table.addRow(f, 'pass');
				});
			});
		this.logger.info(`\n${table.toString()}`);
		return this;
	}

	/**
   * Loads all modals
   * @param {string} path
   */
	loadModals(path) {
		this.logger.info('Loading modals...');
		const table = new AsciiTable('Modals');
		table.setHeading('File', 'Status');
		readdirSync(path)
			.filter((f) => !f.endsWith('.js'))
			.forEach((dir) => {
				const slashes = readdirSync(resolve(__basedir, join(path, dir))).filter(
					(f) => f.endsWith('js'),
				);
				slashes.forEach((f) => {
					const Modal = require(resolve(__basedir, join(path, dir, f)));
					const modal = new Modal(this);
					this.modals.set(modal.name, modal);
					table.addRow(f, 'pass');
				});
			});
		this.logger.info(`\n${table.toString()}`);
		return this;
	}

	/**
   * Loads all Buttons
   * @param {string} path
   */
	loadButtons(path) {
		this.logger.info('Loading buttons...');
		const table = new AsciiTable('Buttons');
		table.setHeading('File', 'Status');
		readdirSync(path)
			.filter((f) => !f.endsWith('.js'))
			.forEach((dir) => {
				const slashes = readdirSync(resolve(__basedir, join(path, dir))).filter(
					(f) => f.endsWith('js'),
				);
				slashes.forEach((f) => {
					const Button = require(resolve(__basedir, join(path, dir, f)));
					const button = new Button(this);
					this.buttons.set(button.name, button);
					table.addRow(f, 'pass');
				});
			});
		this.logger.info(`\n${table.toString()}`);
		return this;
	}

	/**
   * Loads all Buttons
   * @param {string} path
   */
	loadSelectMenus(path) {
		this.logger.info('Loading Selects Menus...');
		const table = new AsciiTable('Selects Menus');
		table.setHeading('File', 'Status');
		readdirSync(path)
			.filter((f) => !f.endsWith('.js'))
			.forEach((dir) => {
				const slashes = readdirSync(resolve(__basedir, join(path, dir))).filter(
					(f) => f.endsWith('js'),
				);
				slashes.forEach((f) => {
					const Menu = require(resolve(__basedir, join(path, dir, f)));
					const menu = new Menu(this);
					this.menus.set(menu.name, menu);
					table.addRow(f, 'pass');
				});
			});
		this.logger.info(`\n${table.toString()}`);
		return this;
	}

	/**
   * Loads all available events
   * @param {string} path
   * @param client
   * @param player
   */
	loadEvents(path, client, player) {
		readdir(path, (err, files) => {
			if (err) this.logger.error(err);
			files = files.filter((f) => f.split('.').pop() === 'js');
			if (files.length === 0) return this.logger.warn('No events found');
			this.logger.info(`${files.length} event(s) found...`);
			files.forEach((f) => {
				const event = require(resolve(__basedir, join(path, f)));
				if (event.once) {
					super.once(event.name, (...args) =>
						event.execute(...args, Slashes),
					);
				}
				else if (event.name === 'interactionCreate') {
					super.on(event.name, (...args) =>
						event.execute(...args, Slashes, Commands, client, player),
					);
				}
				else {
					super.on(event.name, (...args) =>
						event.execute(...args, Commands, client, player),
					);
				}
			});
		});
		return this;
	}


	/**
   * Checks if user is the bot owner
   * @param {User} user
   */
	isOwner(user) {
		if (parseInt(user.id) === this.id) return true;

		for (let i = 0; i < this.developerID.length; i++) {
			if (parseInt(this.developerID[i]) === parseInt(user.id)) return true;
		}

		return parseInt(user.id) === parseInt(this.ownerID);
	}

	queue() {
		return queue;
	}

	/**
   * Creates and sends system failure embed
   * @param {Guild} guild
   * @param {string} error
   * @param {string} errorMessage
   */
	async sendSystemErrorMessage(guild, error, errorMessage) {
		// Get system channel
		const systemChannelId = await this.mongodb.settings.selectSystemChannelId(
			guild.id,
		);
		const systemChannel = guild.channels.cache.get(systemChannelId);

		if (
		// Check channel and permissions
			!systemChannel ||
      !systemChannel.viewable ||
      !systemChannel.permissionsFor(guild.me).has(['SEND_MESSAGES', 'EMBED_LINKS'])
		) {return;}

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: `${this.user.tag}`,
				iconURL: this.user.displayAvatarURL({
					dynamic: true,
				}),
			})
			.setTitle(`${fail} System Error: \`${error}\``)
			.setDescription(`\`\`\`diff\n- System Failure\n+ ${errorMessage}\`\`\``)
			.setTimestamp()
			.setColor(guild.me.displayHexColor);
		systemChannel.send({
			embeds: [embed],
		});
	}

	setTimeout_(fn, delay) {
		const maxDelay = Math.pow(2, 31) - 1;

		if (delay > maxDelay) {
			const args = arguments;
			args[1] -= maxDelay;

			return setTimeout(function() {
				setTimeout_.apply(undefined, args);
			}, maxDelay);
		}

		return setTimeout.apply(undefined, arguments);
	}

	clearTimeout_(id) {
		this.setTimeout_(clearTimeout, id);
	}
}

module.exports = Client;