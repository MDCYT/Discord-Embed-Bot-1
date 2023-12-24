const Command = require('../Command.js');
const { Interaction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events, Embed, ButtonBuilder, ButtonStyle, Message } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const Client = require('../../client.js');

module.exports = class GitHubCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'embed',
			usage: 'embed <commando> <nombre> <base>',
			description: 'Aqui se crea el embed (Si).',
			type: client.types.INFO,
		});
	}
	/**
	 * 
	 * @param {Message} message 
	 * @param {Array<String>} args 
	 * @param {Client} client 
	 * @returns 
	 */
	async run(message, args, client) {
		// eslint-disable-next-line prefer-const
		let [type, name, baseEmbed] = args;

		if (!type) return message.reply({ content: 'E we, te falta la opcion pendejo' });
		switch (type) {
			case 'create':
			{
				if (!name || name.toLowerCase() == "uuid") name = uuidv4();
				if (!baseEmbed) baseEmbed = "--vacio"; // idk
				const embed = new EmbedBuilder()
				.setTitle("Embed vacio")
				if (baseEmbed.toLowerCase().includes("ejemplo")) {
				embed
				.setTitle('Embed de ejemplo')
				.setAuthor({name: 'Autor de ejemplo', iconURL: 'https://i.pinimg.com/736x/89/0d/02/890d025a8bd0f50a58c9847dd891c2f8.jpg', url: 'https://github.com/mdcyt/'})
				.setDescription('Esto es una descripción de ejemplo para tu embed.')
				.setURL( 'https://github.com/mdcyt/')
				.setColor("Random")
				.setThumbnail( 'https://media.discordapp.net/attachments/1187757313205993582/1188294051812880435/d30efa5bed173b942c0bb4d9dc1f98ab.png')
				.setFooter({'text': 'Esto es un footer de ejemplo', 'iconURL': 'https://media.discordapp.net/attachments/1187757313205993582/1188294657386483732/9k.png'})
				.setTimestamp()
				}				
				if (!this.map)
				this.map = new Map()
				var _handlerInteraction =  async interaction => await this.miniInteractionHandler(interaction, name, embed)
				this.map.set(name, Math.floor((new Date().getTime() + ((200_00 * 60) ) )/ 1000));
				const msg = await message.reply(this.baseData(embed, name))
				client.on(Events.InteractionCreate, _handlerInteraction);
				setTimeout(()=> {
					client.logger.info("Caducó")
					msg.edit({content: `El mensaje caducó.`, embeds: [], components: []})
					client.off(Events.InteractionCreate, _handlerInteraction);
				}, (200_00 * 60) )
			}
		}
		}
		
		/**
		 * 
		 * @param {Interaction} interaction 
		 * @param {String} name 
		 * @param {EmbedBuilder} embed 
		 * @returns 
		 */
		 async miniInteractionHandler(interaction, name, embed) {
				if (!interaction.customId.split('_')[1] === name) return; // niz note: im not too much sure, but ola

				if (interaction.isStringSelectMenu()) {
					return this.onMenuInteraction(interaction,name, embed)
				}
				if (!interaction.isModalSubmit()) return;
				console.log(interaction.fields.fields)
				
				const [ interactionType, interactionName ] = interaction.customId.split('_');
				global.Client.logger.info(interactionType) ;
				switch (interactionType) {
				case 'edittitle':{
					if (!interaction.fields.fields.get('text').value) embed.data.title = '';
					else embed.setTitle(interaction.fields.fields.get('text').value);
					if (!interaction.fields.fields.get('url').value) embed.data.url = '';
					else embed.setURL(interaction.fields.fields.get('url').value);
					break;
				}
				case 'editdescription': {
					embed.setDescription(interaction.fields.fields.get('description').value || ' ');
					break;
			
				}
				case "editautor": {
					if (!interaction.fields.fields.get('text').value) embed.data.author.name = '';
					else  embed.data.author.name  = (interaction.fields.fields.get('text').value);
					if (!interaction.fields.fields.get('url').value) embed.data.author.url = '';
					else  embed.data.author.url = (interaction.fields.fields.get('url').value);
					if (!interaction.fields.fields.get('iconurl').value) embed.data.author.icon_url	 = '';
					else  embed.data.author.icon_url = (interaction.fields.fields.get('iconurl').value);
					break;
				}
				case 'color': {
					if (!interaction.fields.fields.get('color').value) embed.data.color = '';
					else  embed.setColor("#"+ interaction.fields.fields.get('color').value.toUpperCase().replaceAll('#',"").replace("0XFF", ""), 16);
					break;
				}
				case "footer": {
						if (!interaction.fields.fields.get('text').value) embed.data.footer.text = '';
						else  embed.data.footer.text  = (interaction.fields.fields.get('text').value);
						if (!interaction.fields.fields.get('iconurl').value) embed.data.footer.icon_url = '';
						else  embed.data.footer.icon_url  = (interaction.fields.fields.get('iconurl').value);
						if (!interaction.fields.fields.get('time').value) embed.data.timestamp = '';
						else  embed.setTimestamp(Number(interaction.fields.fields.get('time').value));
						break;
				}
				case "image": { // thumbnail
					if (!interaction.fields.fields.get('img').value) embed.data.image.url = '';
					else  embed.setImage(interaction.fields.fields.get('img').value);
					if (!interaction.fields.fields.get('thumbnail').value) embed.data.thumbnail.url = '';
					else  embed.setThumbnail(interaction.fields.fields.get('thumbnail').value);
					break;
				}
				}

				interaction.message.edit(this.baseData(embed, name));
				interaction.reply({content: 'Editado, no olvides guardar', ephemeral: true,});
			
		 }
		 /**
		  * 
		  * @param {Interaction} interaction 
		  * @param {String} name 
		  * @param {Embed} embed 
		  */
		async onMenuInteraction (interaction, name, embed) {
		{
			const [type] = interaction.values[0].split('_');
			global.Client.logger.info(type);
				switch (type) {
				case 'title': {
					const modal = new ModalBuilder()
						.setCustomId('edittitle_' + name)
						.setTitle('Editar titulo')
						.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
							.setCustomId('text')
							.setLabel('¿Cuál va ser el titulo del embed?')
							.setStyle(TextInputStyle.Short)
							.setMaxLength(256)
							.setValue( embed.data.title || '')
							.setRequired(false)),
						new ActionRowBuilder().addComponents(new TextInputBuilder()
							.setCustomId('url')
							.setLabel('Ponle una url al título (opcional)')
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue( embed.data.url || '')
							.setMaxLength(4000)));
					await interaction.showModal(modal);
					break;
				}
				case 'description': {
					const modal = new ModalBuilder()
						.setCustomId('editdescription_' + name)
						.setTitle('Editar descripcion')
						.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
							.setCustomId('description')
							.setLabel('Cual va ser la descripcion del embed?')
							.setStyle(TextInputStyle.Paragraph)
							.setMaxLength(4000)
							.setValue(embed.data.description || '')
							.setRequired(false)),
						);
					await interaction.showModal(modal);
					break;
				}
				case 'author': {
				global.Client.logger.info(embed.data.author.url.length);

					const modal = new ModalBuilder()
					.setCustomId('editautor_' + name)
					.setTitle('Editar autor')
					.addComponents(new ActionRowBuilder().addComponents(
						new TextInputBuilder()
							.setCustomId('text')
							.setLabel('¿Cuál va ser el autor del embed? (OPCIONAL)')
							.setStyle(TextInputStyle.Short)
							.setMaxLength(256)
							.setValue(embed.data.author.name || '')
							.setRequired(false)),
							new ActionRowBuilder().addComponents(new TextInputBuilder()
							.setCustomId('url')
							.setLabel('¿Qué link tendrá el autor? (OPCIONAL) ')
							.setStyle(TextInputStyle.Short)
							.setValue(embed.data.author.url || '')
							.setRequired(false)),
							new ActionRowBuilder().addComponents(new TextInputBuilder()
							.setCustomId('iconurl')
							.setLabel('¿Qué imagen tendrá el autor? (OPCIONAL)')
							.setStyle(TextInputStyle.Short)
							.setValue(embed.data.author.icon_url || '')
							.setRequired(false))
					);
				await interaction.showModal(modal);
					break;
				}
				case 'color': {
					const modal = new ModalBuilder()
					.setCustomId('color_' + name)
					.setTitle('Color del embed')
					.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
						.setCustomId('color')
						.setLabel('Selecciona el color del embed')
						.setStyle(TextInputStyle.Paragraph)
						.setValue(String(embed.data.color?.toString(16) || ''))
						.setMaxLength(256)
						.setRequired(false)),
					);
				await interaction.showModal(modal);
				break;
				}
				case 'image': {
					const modal = new ModalBuilder()
					.setCustomId('image_' + name)
					.setTitle('Imagenes del embed')
					.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
						.setCustomId('thumbnail')
						.setLabel('Imagen miniatura del embed ')
						.setStyle(TextInputStyle.Paragraph)
						.setValue( embed.data.thumbnail?.url || '')
						.setRequired(false)),
						new ActionRowBuilder().addComponents(new TextInputBuilder()
						.setCustomId('img')
						.setLabel('Imagen del embed')
						.setStyle(TextInputStyle.Paragraph)
						.setValue( embed.data.image?.url || '')
						.setRequired(false)),
					);
				await interaction.showModal(modal);
				break;
				}
				case "footer": {
					const modal = new ModalBuilder()
					.setCustomId('footer_' + name)
					.setTitle('Cambia el footer del embed')
					.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
						.setCustomId('text')
						.setLabel('¿Cuál será el texto del footer?')
						.setStyle(TextInputStyle.Paragraph)
						.setValue(embed.data.footer.text || "")
						.setMaxLength(256)
						.setRequired(false)),
						new ActionRowBuilder().addComponents(new TextInputBuilder()
						.setCustomId('iconurl')
						.setLabel('¿Cuál será la imagen del footer?')
						.setStyle(TextInputStyle.Paragraph)
						.setValue(embed.data.footer.icon_url || "")
						.setMaxLength(256)
						.setRequired(false)),
						new ActionRowBuilder().addComponents(new TextInputBuilder()
						.setCustomId('time')
						.setLabel('¿Cuál será el tiempo del footer?')
						.setStyle(TextInputStyle.Paragraph)
						.setValue(String(new Date(embed.data.timestamp).getTime())|| "")
						.setMaxLength(256)
						.setRequired(false)),
					);
				await interaction.showModal(modal);
					break;
				}
				default: {
					const modal = new ModalBuilder()
					.setCustomId('null_' + name)
					.setTitle('Esto no debió aparecer we')
					.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
						.setCustomId('description')
						.setLabel('no pos, escribe we')
						.setStyle(TextInputStyle.Paragraph)
						.setMaxLength(1)
						.setRequired(false)),
					);
				await interaction.showModal(modal);
				break;
				}
				}
			}
		}
		baseData(embed, name) {
			return {embeds: [embed], content: `\`Embed: ${name}\` - Caduca:  <t:${this.map.get(name)}:R>`, components: this.addSwagComponents(embed, name)}
		}
		/**
		 * 
		 * @param {Embed} embed 
		 * @param {String} name 
		 * @returns 
		 */
		 addSwagComponents(embed, name) {
			const swagMenu = new ActionRowBuilder().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId('help_menu')
					.setPlaceholder('Selecciona una opcion')
					.addOptions([
						{
							label: 'Editar titulo',
							description: 'Edita el titulo del embed',
							value: `title_${name}`,
						},
						{
							label: 'Editar descripcion',
							description: 'Edita la descripcion del embed',
							value: `description_${name}`,
						},
						{
							label: 'Editar autor',
							description: 'Edita el autor visible del embed',
							value: `author_${name}`,

						},
						{
							label: 'Editar color',
							description: 'Edita el color del embed',
							value: `color_${name}`,
						},
						{
							label: 'Editar footer',
							description: 'Edita el footer del embed',
							value: `footer_${name}`,
						},
						{
							label: 'Editar imagenes',
							description: 'Edita el imagenes actuales del embed (usar un link)',
							value: `image_${name}`,
						},
					
				
					]),
			
			);
			const swagButtons = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId("save_" + name)
					.setLabel("Guardar embed")
					.setStyle(ButtonStyle.Success),
			    new ButtonBuilder()
					.setCustomId("delete_" + name)
					.setLabel("Borrar embed")
					.setDisabled(true)
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setLabel("Ver documentación")
					.setURL("https://github.com/mdcyt")
					.setStyle(ButtonStyle.Link)
			);
			return [swagMenu,swagButtons];
		}

	
};