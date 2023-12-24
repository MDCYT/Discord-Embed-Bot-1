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
			name: 'send',
			usage: 'send <channel> <embed_id> <webhook-id>',
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
        let [ch, embed_id, webhook] = args;
        if (args.length <=  2)
            args.push("");
        args.splice(0, args.indexOf(embed_id) + 1);
        /**
         * @type {Channel}
         */
        const channel = message.mentions.channels.first() || message.channel;
        const webhooks = await channel.fetchWebhooks()
        if (!channel) return message.reply("No hay chanel we");
        if (!embed_id) return message.reply("No hay embed_id we");
        //if (webhook) webhook = webhook.toLowerCase();
        const embed_Data = await selectRow(embed_id)

        if (!embed_Data[0])
        return message.reply(`Can't find embed with ID: ${embed_id}, please use \`/embed create ${embed_id}\` to create the embed with this ID`)

        /*if (webhook.startsWith("https://discord.com/api/webhooks/")) {
            webhook = webhook.split("/")[5]; // resolve link
            client.logger.info(webhook + " result ID");
        }*/

    var web = undefined;

    await webhooks.forEach(async webHok =>{
            if ( webHok.owner.id === client.user.id) {
                    if (!web){
                        web =  webHok;
                    } else {
                        await webHok.delete()
                    }
            }
        } )
          if (!web) {
                web = await channel.createWebhook({
                     name: message.author.username,
                     avatar: message.author.avatarURL({size: 1024})
                 })
                // message.reply("Creé un webhook con la ID " + web.id + " - lo podrás usar más tarde para el tercer argumento.")
             }
             const embed = new EmbedBuilder(embed_Data[0].json)
            await web.send({content: args.join(" "), embeds: [embed]});
            message.reply("Mensaje enviado (creo)")

    
      
	}
};