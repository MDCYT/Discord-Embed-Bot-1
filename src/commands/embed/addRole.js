const Command = require('../Command.js');
const { Interaction, EmbedBuilder, 
        ActionRowBuilder, StringSelectMenuBuilder, 
        ModalBuilder, TextInputBuilder, TextInputStyle, 
        Events, Embed, ButtonBuilder, ButtonStyle, Message,
        Channel, Webhook
    } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const Client = require('../../client.js');
const {createEmbed,selectRow, editEmbed, formatData, delecteRow} = require('../../utils/databases/embeds.js')

module.exports = class SendCmd extends Command {
	constructor(client) {
		super(client, {
			name: 'add',
			usage: 'add <comando> <...args>',
			description: 'Displays the link to Any Bot\'s GitHub repository.',
			type: client.types.INFO,
		});
	}
    /**
     * 
     * @param {Message} message 
     * @param {Array<String>} args 
     * @param {Client} client 
     */
	async run(message, args, client) {
        let [type, ...restArgs] = args;
        if (!type) return message.reply("Tu no ere el pepe")
        switch(type.toLowerCase()) {
            case "role":
                const [ID, ...roles] = restArgs;
                
                message.reply("Soon!");
                
            break;
            case ":v":
            break;
        }
      
	}
};