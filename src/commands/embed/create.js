const Command = require('../Command.js');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require('discord.js');
const { v4: uuidv4 } = require('uuid');

module.exports = class GitHubCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'embed',
			usage: 'embed <commando> <nombre>',
			description: 'Aqui se crea el embed (Si).',
			type: client.types.INFO,
		});
	}
	async run(message, args, client) {
		// eslint-disable-next-line prefer-const
		let [type, name] = args;

		if (!type) return message.reply({ content: 'E we, te falta la opcion pendejo' });
		switch (type) {
		case 'create':
		{

			if (!name) name = uuidv4();
			const embed = new EmbedBuilder()
				.setTitle('Embed: ' + name);

			await message.reply({
				embeds: [embed],
				content: 'Embed: ' + name,
				components: [new ActionRowBuilder().addComponents(
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
						]),
				)],
			}).then(important);

			client.on(Events.InteractionCreate, async interaction => {
				if (interaction.isStringSelectMenu()) {
					switch (interaction.values[0].split('_')[0]) {
					case 'title': {
						const modal = new ModalBuilder()
							.setCustomId('edittitle_' + name)
							.setTitle('Editar titulo')
							.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
								.setCustomId('text')
								.setLabel('Cual va ser el titulo del embed?')
								.setStyle(TextInputStyle.Short)
								.setMaxLength(256)
								.setRequired(false)),
							new ActionRowBuilder().addComponents(new TextInputBuilder()
								.setCustomId('url')
								.setLabel('Pomle una url al titulo (opcional)')
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setMaxLength(256)));
						await interaction.showModal(modal);
						return;
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
								.setRequired(false)),
							);
						await interaction.showModal(modal);
					}
					}
				}
				if (!interaction.isModalSubmit()) return;
				if (!interaction.customId.split('_')[1] === name) return;
				const [ type2 ] = interaction.customId.split('_');
				switch (type2) {
				case 'edittitle':{
					if (!interaction.fields.fields.get('text').value) embed.data.title = '';
					else embed.setTitle(interaction.fields.fields.get('text').value);

					if (!interaction.fields.fields.get('url').value) embed.data.url = '';
					else embed.setURL(interaction.fields.fields.get('url').value);

					interaction.message.edit({
						embeds: [embed],
						content: 'Embed: ' + name,
						components: [new ActionRowBuilder().addComponents(
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
								]),
						)],
					});
					interaction.reply({
						content: 'Editado, no olvides guardar',
						ephemeral: true,
					});
					return;
				}
				case 'editdescription': {
					embed.setDescription(interaction.fields.fields.get('description').value || ' ');
					interaction.message.edit({
						embeds: [embed],
						content: 'Embed: ' + name,
						components: [new ActionRowBuilder().addComponents(
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
								]),
						)],
					});
					interaction.reply({
						content: 'Editado, no olvides guardar',
						ephemeral: true,
					});
					break;
				}
				}
			});
		}
		}

		function important(newMessage) {
			const filter = () => true;

			const collector = newMessage.createMessageComponentCollector({ filter, time: 15_000 * 60 * 60 });
			collector.on('collect', async i => {
				console.log(i.values[0]);
			});
			collector.on('end', collected => console.log(`Collected ${collected.size} items`));
		}
	}
};