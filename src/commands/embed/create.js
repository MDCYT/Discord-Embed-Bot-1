/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-inline-comments */
const Command = require('../Command.js');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events, ButtonBuilder, ButtonStyle } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const { createEmbed, selectRow, editEmbed, formatData, delecteRow, showAllEmbeds } = require('../../utils/databases/embeds.js');

module.exports = class EmbedCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'embed',
			aliases: ["embeds", "emb"],
			usage: 'embed <commando> <nombre> <base>',
			description: 'Aqui se crea el embed (Si).',
			type: client.types.INFO,
			disabled: true,
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
		let embed = new EmbedBuilder();
		const msg = await message.reply('cargando...');

		if (!type) {
			embed.setTitle('Missing fields')
				.setDescription('Se esperaba al menos un argumento `<comando>`\n### Ejemplos de uso:\n```/embed create mi-embed -ejemplo\n/embed edit embed-de-bienvenidas\n/embed delete embed-basura```\n')
				.setThumbnail(message.author.avatarURL())
				.setColor('Random')
				.setTimestamp();
			return msg.edit({ embeds: [embed] });
		}
		type = type.toLowerCase();

		if (!this.res) { this.res = new Map(); }
		const _handlerInteraction = async interaction => await this.miniInteractionHandler(interaction, name, embed);


		if (type !== 'all') { if (!name || name.toLowerCase() == 'uuid') name = uuidv4(); }
		// Init currentSession
		message.shouldBeShowAnotherModal = false;
		this.res.set(name,
			{
				expirteIn: Math.floor((new Date().getTime() + ((200_00 * 60))) / 1000),
				oldMsg: message,
				client,
				args,
				type,
				name,
				baseEmbed,
				msg,
				_handlerInteraction, // uhhh yay
			});

		switch (type) {
			case 'all': {
				const sawagID = uuidv4();
				const content = 'Caduca: <t:' + Math.floor((new Date().getTime() + ((200_00 * 60))) / 1000) + ':R>';
				if (!name) name = '1';
				const showByINDEX = async (name2) => {
					if (isNaN(Number(name2))) { name2 = '1'; }
					const embeds = await showAllEmbeds();
					let index = Number(name2);
					if (index > Math.floor(embeds.length / 10)) { index = 0; }
					if (index < 1) { index = Math.floor(embeds.length / 10) - 1; }
					index = Math.abs(index);
					index -= 1;
					const datas = [];
					const embedsSpliced = embeds.splice((index * 10) + 0, (index * 10) + 10);
					embedsSpliced.forEach(embedData => {
						datas.push(String(index * 10 + datas.length + 1) + '. `' + embedData.ID + '` - creado en: <t:' + Math.floor(embedData.date.getTime() / 1000) + '> - `(' + embedData.json.title + ')`');
					});
					index += 1;

					embed.setTitle('todos los embeds creados')
						.setDescription(`## Lista (ordenado por fecha)\n${datas.join('\n')}\n### Index: ${String(index)} de ${String(Math.floor(embeds.length / 10) + 1)}`)
						.setThumbnail(message.author.avatarURL())
						.setColor('Random')
						.setTimestamp();
					const swagButtons = new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId('<-_' + sawagID)
							.setLabel('<-')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId('cancel_' + sawagID)
							.setLabel('Cancelar')
							.setStyle(ButtonStyle.Danger),
						new ButtonBuilder()
							.setCustomId('->_' + sawagID)
							.setLabel('->')
							.setStyle(ButtonStyle.Primary),
					);
					name = String(index);

					await msg.edit({ content: content, embeds: [embed], components: [swagButtons] });
				};
				showByINDEX(name);
				/**
					 *
					 * @param {Interaction} interaction
					 */
				const handler = async (interaction) => {
					const [interactionType, interactionName] = interaction.customId.split('_');
					if (!interaction.isButton() && interactionName !== sawagID) return;
					switch (interactionType) {
						case '<-':
							console.log(name);
							await showByINDEX(String(Number(name) - 1));
							interaction.reply({ content: 'Cambio el index a: ' + String(Number(name)), ephemeral: true });

							break;
						case 'cancel':
							client.off(Events.InteractionCreate, handler);
							interaction.reply({ content: 'Cancelado', ephemeral: true });

							msg.edit('Caduca: `Caducado`');
							break;
						case '->':
							await showByINDEX(String(Number(name) + 1));
							interaction.reply({ content: 'Cambio el index a: ' + String(Number(name)), ephemeral: true });


							break;
					}


				};
				client.on(Events.InteractionCreate, handler);
				setTimeout(() => {
					client.off(Events.InteractionCreate, handler);
					msg.edit('Caduca: `Caducado`');
				}, (200_00 * 60));
				return;
			}
			default: {
				embed.setTitle('Invalid argument')
					.setDescription(`Se esperaba que el argumento 1: \`<comando>\` no fuse invalido, pero resultó que \`${type}\` no es un argumento válido.\n### Ejemplos de uso:\n\`\`\`/embed create mi-embed -ejemplo\n/embed edit embed-de-bienvenidas\n/embed delete embed-basura\`\`\`\n`)
					.setThumbnail(message.author.avatarURL())
					.setColor('Random')
					.setTimestamp();
				return msg.edit({ content: '', embeds: [embed] });
			}
			case 'delete': {
				const embedData = await selectRow(name);
				if (embedData.length > 0) {
					await delecteRow(name);
					embed.setTitle('Se ha borrado correctamente el embed')
						.setDescription(`Se borró el embed \`${name}\` y se logró correctamente.`)
						.setThumbnail(message.author.avatarURL())
						.setColor('Random')
						.setTimestamp();
					return msg.edit({ content: '', embeds: [embed] });
				}
				else {
					embed.setTitle('Fallo al buscar')
						.setDescription(`No se concretó el borrado del embed ya que no se encontró ningún embed con el nombre \`${name}\`.`)
						.setThumbnail(message.author.avatarURL())
						.setColor('Random')
						.setTimestamp();
					return msg.edit({ content: '', embeds: [embed] });
				}
			}
			case 'show':
			case 'edit': {
				const embedData = await selectRow(name);
				if (embedData.length < 1) {
					embed.setTitle('Fallo al buscar')
						.setDescription(`No se concretó el buscado del embed ya que no se encontró ningún embed con el nombre \`${name}\`.`)
						.setThumbnail(message.author.avatarURL())
						.setColor('Random')
						.setTimestamp();

					return msg.edit({ content: '', embeds: [embed] });
				}
				else {

					embed.setTitle('Este embed no se importó correctamente.');

					embed = new EmbedBuilder(embedData[0].json);
					if (type !== 'show') {
						client.on(Events.InteractionCreate, _handlerInteraction);
						setTimeout(() => {
							this.onBadMsg(msg, client, name);
						}, (200_00 * 60));
					}
					else {
						this.res.set(name, undefined);
					}
					msg.edit(this.baseData(embed, name));


				}
				break;
			}
			case 'create':
				{
					if (!baseEmbed) {
						baseEmbed = "-vacio";
						embed.setTitle('Embed vacio')
					};
					if (baseEmbed.startsWith("-")) {
						baseEmbed = baseEmbed.slice(1, baseEmbed.length);
						console.log(baseEmbed);

						const embedData = (await selectRow(baseEmbed))[0];
						console.log(embedData);
						if (embedData)
							embed = new EmbedBuilder(embedData.json)

					} else {
						embed.setTitle('Embed vacio');
					}
					const checkEmbeds = (await selectRow(name)).length > 0;
					if (checkEmbeds) {
						embed.setTitle('Fallo al crear')
							.setDescription(`Ya hay un embed con la ID: \`${name}\` porfavor use \`/embed edit ${name}\` para editarlo.`)
							.setThumbnail(message.author.avatarURL())
							.setColor('Random')
							.setTimestamp();

						return msg.edit({ content: '', embeds: [embed] });
					}
					if (!baseEmbed) baseEmbed = '--vacio'; // idk

					if (baseEmbed.toLowerCase().includes('ejemplo') || baseEmbed.toLowerCase().includes('example')) {
						embed
							.setTitle('Embed de ejemplo')
							.setAuthor({ name: 'Autor de ejemplo', iconURL: 'https://i.pinimg.com/736x/89/0d/02/890d025a8bd0f50a58c9847dd891c2f8.jpg', url: 'https://github.com/mdcyt/' })
							.setDescription('Esto es una descripción de ejemplo para tu embed.')
							.setURL('https://github.com/mdcyt/')
							.setColor('Random')
							.setThumbnail('https://media.discordapp.net/attachments/1187757313205993582/1188294051812880435/d30efa5bed173b942c0bb4d9dc1f98ab.png')
							.setFooter({ 'text': 'Esto es un footer de ejemplo', 'iconURL': 'https://media.discordapp.net/attachments/1187757313205993582/1188294657386483732/9k.png' })
							.setTimestamp();
					}


					await msg.edit(this.baseData(embed, name));

					client.on(Events.InteractionCreate, _handlerInteraction);
					setTimeout(() => {
						this.onBadMsg(msg, client, name);
					}, (200_00 * 60));
					break;
				}
		}
	}
	async onBadMsg(msg, client, name) {
		client.logger.info('Caducó');
		client.off(Events.InteractionCreate, this.res.get(name)._handlerInteraction);
		this.res.set(name, undefined);
		msg.edit(this.baseData(msg.embeds[0], name));


	}

	/**
		 *
		 * @param {Interaction} interaction
		 * @param {String} name
		 * @param {EmbedBuilder} embed
		 * @returns
		 */
	async miniInteractionHandler(interaction, name, embed) {
		const [interactionType, interactionName] = interaction.customId.split('_');

		if (!interactionName === name) return; // niz note: im not too much sure, but ola
		if (interaction.isButton()) {
			switch (interactionType) {
				case 'cancel': {
					this.onBadMsg(this.res.get(name).msg, global.Client, name);
					interaction.reply({ content: 'Cancelado!', ephemeral: true });

					break;
				}
				case 'save': {
					if (this.res.get(name).type !== 'edit') { await createEmbed(name, embed.toJSON()); }
					else { await editEmbed(name, embed.toJSON()); }

					interaction.reply({ content: 'Guardado!', ephemeral: true });
					break;
				}
				case 'delete': {
					delecteRow(name);
					const oldMsg = this.res.get(name).msg;
					this.onBadMsg(this.res.get(name).msg, global.Client, name);
					interaction.reply({ content: 'Borrado!', ephemeral: true });
					oldMsg.edit({ content: 'Este embed fue borrado.', embeds: [] });
					break;
				}
			}

		}
		if (interaction.isStringSelectMenu()) {
			return this.onMenuInteraction(interaction, name, embed);
		}
		if (!interaction.isModalSubmit()) return;

		global.Client.logger.info(interactionType);
		switch (interactionType) {
			case 'edittitle': {
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
			case 'editautor': {
				if (!embed.data.author) {
					embed.data.author = {
						name: '',
						url: '',
						icon_url: '',
					};
				}
				if (!interaction.fields.fields.get('text').value) embed.data.author.name = '';
				else embed.data.author.name = (interaction.fields.fields.get('text').value);
				if (!interaction.fields.fields.get('url').value) embed.data.author.url = '';
				else embed.data.author.url = (interaction.fields.fields.get('url').value);
				if (!interaction.fields.fields.get('iconurl').value) embed.data.author.icon_url = '';
				else embed.data.author.icon_url = (interaction.fields.fields.get('iconurl').value);
				break;
			}
			case 'color': {
				if (!interaction.fields.fields.get('color').value) embed.data.color = '';
				else embed.setColor('#' + interaction.fields.fields.get('color').value.toUpperCase().replaceAll('#', '').replace('0XFF', ''), 16);
				break;
			}
			case "fieldsinline": {
				var copyOfFields = [];
				if (embed.data.fields)
					copyOfFields = [].concat(embed.data.fields);
				const fields = [];

				for (let i = 1; i < 6; i++) {
					console.log('field_' + i   + '_inline');
					if (copyOfFields[i - 1] && copyOfFields[i-1].name) {
						fields.push({
							name: copyOfFields[i-1]?.name || `Nombre no valido`,
							value: copyOfFields[i-1]?.description  || `Descripcion no valida`,
							inline: interaction.fields.fields.get('field_' + (i)  + '_inline').value.startsWith("s")
						})
					} 
				}
				embed.setFields(fields)
				break;
			
			}
			case "fieldsdescription": {
				var copyOfFields = [];
				if (embed.data.fields)
					copyOfFields = [].concat(embed.data.fields);
				const fields = [];

				for (let i = 1; i < 6; i++) {
					console.log('field_' + i   + '_description');
					if (interaction.fields.fields.get('field_' + (i)  + '_description').value ) {
						fields.push({
							name: copyOfFields[i-1]?.name || `Nombre no valido`,
							value: interaction.fields.fields.get('field_' + i  + '_description').value || `Descripcion no valida`,
							inline: copyOfFields[i-1]?.inline
						})
					} 
				}
				embed.setFields(fields)
				break;
			
			}
			case 'fieldstitle': {
				var copyOfFields = [];
				if (embed.data.fields)
					copyOfFields = [].concat(embed.data.fields);
				const fields = [];

				for (let i = 1; i < 6; i++) {
					console.log('field_' + i   + '_name');
					if (interaction.fields.fields.get('field_' + (i)  + '_name').value) {
						fields.push({
							name: interaction.fields.fields.get('field_' + i  + '_name').value || `Nombre no valido`,
							value: copyOfFields[i-1]?.value|| `Descripcion no valida`,
							inline: copyOfFields[i-1]?.inline
						})
					} 
				}
				embed.setFields(fields)

				break;
			}
			case 'footer': {
				if (!embed.data.footer) {
					embed.data.footer = {
						text: '',
						icon_url: '',
					};
				}
				if (!interaction.fields.fields.get('text').value) embed.data.footer.text = '';
				else embed.data.footer.text = (interaction.fields.fields.get('text').value);
				if (!interaction.fields.fields.get('iconurl').value) embed.data.footer.icon_url = '';
				else embed.data.footer.icon_url = (interaction.fields.fields.get('iconurl').value);
				if (!interaction.fields.fields.get('time').value) embed.data.timestamp = '';
				else embed.setTimestamp(Number(interaction.fields.fields.get('time').value));
				break;
			}
			case 'image': { // thumbnail
				if (!interaction.fields.fields.get('img').value) embed.data.image = {};
				else embed.setImage(interaction.fields.fields.get('img').value);
				if (!interaction.fields.fields.get('thumbnail').value) embed.data.thumbnail = {};
				else embed.setThumbnail(interaction.fields.fields.get('thumbnail').value);
				break;
			}
		}

		interaction.message.edit(this.baseData(embed, name));
		interaction.reply({ content: 'Editado, no olvides guardar', ephemeral: true });

	}
	/**
	 *
	 * @param {Interaction} interaction
	 * @param {String} name
	 * @param {Embed} embed
	 */
	async onMenuInteraction(interaction, name, embed) {
		{
			const [type] = interaction.values[0].split('_');
			global.Client.logger.info(type);
			switch (type) {
				case 'export': {
					interaction.reply({
						content: (`\`\`\`json\n${JSON.stringify(formatData(name, embed.toJSON()))}\`\`\``),
						ephemeral: true,
					}); // Yeah dumb code
					break;
				}
				case 'title': {
					const modal = new ModalBuilder()
						.setCustomId('edittitle_' + name)
						.setTitle('Editar titulo')
						.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
							.setCustomId('text')
							.setLabel('¿Cuál va ser el titulo del embed?')
							.setStyle(TextInputStyle.Short)
							.setMaxLength(256)
							.setValue(embed.data.title || '')
							.setRequired(false)),
							new ActionRowBuilder().addComponents(new TextInputBuilder()
								.setCustomId('url')
								.setLabel('Ponle una url al título (opcional)')
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setValue(embed.data.url || '')
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
					const modal = new ModalBuilder()
						.setCustomId('editautor_' + name)
						.setTitle('Editar autor')
						.addComponents(new ActionRowBuilder().addComponents(
							new TextInputBuilder()
								.setCustomId('text')
								.setLabel('¿Cuál va ser el autor del embed? (OPCIONAL)')
								.setStyle(TextInputStyle.Short)
								.setMaxLength(256)
								.setValue(embed.data.author?.name || '')
								.setRequired(false)),
							new ActionRowBuilder().addComponents(new TextInputBuilder()
								.setCustomId('url')
								.setLabel('¿Qué link tendrá el autor? (OPCIONAL) ')
								.setStyle(TextInputStyle.Short)
								.setValue(embed.data.author?.url || '')
								.setRequired(false)),
							new ActionRowBuilder().addComponents(new TextInputBuilder()
								.setCustomId('iconurl')
								.setLabel('¿Qué imagen tendrá el autor? (OPCIONAL)')
								.setStyle(TextInputStyle.Short)
								.setValue(embed.data.author?.icon_url || '')
								.setRequired(false)),
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
							.setValue(embed.data.thumbnail?.url || '')
							.setRequired(false)),
							new ActionRowBuilder().addComponents(new TextInputBuilder()
								.setCustomId('img')
								.setLabel('Imagen del embed')
								.setStyle(TextInputStyle.Paragraph)
								.setValue(embed.data.image?.url || '')
								.setRequired(false)),
						);
					await interaction.showModal(modal);
					break;
				}
				case 'footer': {
					if (!embed.data.timestamp) embed.data.timestamp = new Date().getTime();
					const modal = new ModalBuilder()
						.setCustomId('footer_' + name)
						.setTitle('Cambia el footer del embed')
						.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
							.setCustomId('text')
							.setLabel('¿Cuál será el texto del footer?')
							.setStyle(TextInputStyle.Paragraph)
							.setValue(embed.data.footer?.text || '')
							.setMaxLength(256)
							.setRequired(false)),
							new ActionRowBuilder().addComponents(new TextInputBuilder()
								.setCustomId('iconurl')
								.setLabel('¿Cuál será la imagen del footer?')
								.setStyle(TextInputStyle.Paragraph)
								.setValue(embed.data.footer?.icon_url || '')
								.setMaxLength(256)
								.setRequired(false)),
							new ActionRowBuilder().addComponents(new TextInputBuilder()
								.setCustomId('time')
								.setLabel('¿Cuál será el tiempo del footer?')
								.setStyle(TextInputStyle.Paragraph)
								.setValue(String(new Date(embed.data.timestamp).getTime()) || '')
								.setMaxLength(256)
								.setRequired(false)),
						);
					await interaction.showModal(modal);
					break;
				}
				case 'fieldstitle': {
					const modal = new ModalBuilder()
						.setCustomId('fieldstitle_' + name)
						.setTitle('Aqui pon tus titulos')
					if (!embed.data.fields) embed.data.fields = [];
					for (let i = 0; i < 5; i++) {
						modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
							.setCustomId(`field_${i + 1}_name`)
							.setLabel(`Aqui pon el titulo de la ${i + 1} columna`)
							.setStyle(TextInputStyle.Short)
							.setValue(embed.data.fields[i]?.name || ``)
							.setMaxLength(256)
							.setRequired(false)))
					}
		this.res.get(name).oldMsg.shouldBeShowAnotherModal = true;

					await interaction.showModal(modal);
					break;
				}
				case 'fieldsdescription': {
					const modal = new ModalBuilder()
						.setCustomId('fieldsdescription_' + name)
						.setTitle('Aqui pon tus descripciones')
						if (!embed.data.fields) embed.data.fields = [];

					for (let i = 0; i < 5; i++) {
						modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
							.setCustomId(`field_${i + 1}_description`)
							.setLabel(`Aqui pon la descripcion de la ${i + 1} columna`)
							.setStyle(TextInputStyle.Paragraph)
							.setValue(embed.data.fields[i]?.value || ``)
							.setMaxLength(1024)
							.setRequired(false)))
					}

					await interaction.showModal(modal);

					break;
				}
				case 'fieldsinlines': {
					const modal = new ModalBuilder()
						.setCustomId('fieldsinline_' + name)
						.setTitle('Aqui pon si quieres apilar los columnas')
						if (!embed.data.fields) embed.data.fields = [];

					for (let i = 0; i < 5; i++) {
						modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
							.setCustomId(`field_${i + 1}_inline`)
							.setLabel(`Aqui si la columna se ${i + 1} debe apilar`)
							.setStyle(TextInputStyle.Paragraph)
							.setValue(embed.data.fields[i]?.inline ?  `si` : `no`)
							.setMaxLength(1024)
							.setRequired(false)))
							
					}

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
		return { embeds: embed ? [embed] : [], content: `\`Embed: ${name || 'sin definir'}\` - ${this.res.get(name) ? `Caduca:  <t:${this.res.get(name)?.expirteIn}:R>` : 'Caduca: `caducado`'}`, components: this.addSwagComponents(embed, name) };
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
				.setDisabled(!this.res.get(name))
				.addOptions([
					{
						label: 'Exportar información', // uhh prefix
						description: 'Puedes usar estos datos para importarlo con /embed import <datos>',
						value: `export_${name}`,
					},
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
					{
						label: 'Editar los titulos de las columnas',
						description: 'Edita los titulos de las columnas',
						value: `fieldstitle_${name}`,
					},
					{
						label: 'Editar las descripciones de las columnas',
						description: 'Edita las descripciones de las columnas',
						value: `fieldsdescription_${name}`,
					},
					{
						label: 'Editar fields inlines',
						description: 'Edita los inlines del los Fields (No se como se dice en español)',
						value: `fieldsinlines_${name}`,
					},


				]),

		);
		const swagButtons = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('save_' + name)
				.setLabel('Guardar embed')
				.setStyle(ButtonStyle.Success)
				.setDisabled(!this.res.get(name)),
			new ButtonBuilder()
				.setCustomId('delete_' + name)
				.setLabel('Borrar embed')
				.setStyle(ButtonStyle.Danger)
				.setDisabled(!this.res.get(name)),
			new ButtonBuilder()
				.setLabel('Cancelar')
				.setCustomId('cancel_' + name)
				.setStyle(ButtonStyle.Primary)
				.setDisabled(!this.res.get(name)),

			new ButtonBuilder()
				.setLabel('Ver documentación')
				.setURL('https://github.com/mdcyt')
				.setDisabled(!this.res.get(name))
				.setStyle(ButtonStyle.Link),
		);
		return [swagMenu, swagButtons];
	}


};