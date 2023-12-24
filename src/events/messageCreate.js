/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
const {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	PermissionFlagsBits,
	ButtonStyle,

} = require('discord.js');
const {
	stripIndents,
} = require('common-tags');

module.exports = {
	name: 'messageCreate',
	async execute(message, _commands, client) {
		if (message.channel.type === 'DM' && !message.author.bot) {
			return message.channel.send({
				embeds: [
					new EmbedBuilder()
						.setColor('#0099ff')
						.setTitle(`Hi, i am ${client.user.username}`)
						.setDescription(
							stripIndents `
            Please, use me in a server.
            If you want to know more about me, use the command \`@${client.user.username} help\` in a server.
            For more information about me, check out my [GitHub](https://github.com/MDCYT/Any-Bot).
            For Support and help, join the [Support Server](https://discord.gg/5UyuwbNu8j).
            For Terms and Conditions, visit the [Terms and Conditions](https://any-bot.tech/tos).
            `,
						)
						.setFooter({
							text: `${client.user.username}`,
							iconURL: client.user.avatarURL(),
						})
						.setThumbnail(client.user.avatarURL())
						.setTimestamp(),
				],
			});
		}
		if (!message.channel.viewable || message.author.bot) return;

		message.command = false;

		// Check if message has image attachment
		const attachment = Array.from(message.attachments.values())[0];
		if (attachment && attachment.url) {
			const extension = attachment.url.split('.').pop();
			if (/(jpg|jpeg|png|gif)/gi.test(extension)) {
				client.mongodb.users.updateTotalImage(
					message.author.id,
					message.guild.id,
				);
			}
		}

		// Get points, XP, disabled commands and prefix
		let {
			messagePoints: messagePoints,
			commandPoints: commandPoints,
			xpTracking: xpTracking,
			messageXP: xpMessages,
			commandXP: xpCommands,
			xpMessageAction: xp_message_action,
			xpChannelID: xp_channel_id,
			disabledCommands: disabledCommands,
			prefix: prefix,
			modChannelIDs: modChannelIds,
			language: language,
		} = await client.mongodb.settings.selectRow(message.guild.id);

		if (typeof disabledCommands !== 'string') disabledCommands = [];
		if (typeof disabledCommands === 'string') {disabledCommands = disabledCommands.split(' ');}

		if (typeof modChannelIds !== 'string') modChannelIds = [];
		if (typeof modChannelIds === 'string') {modChannelIds = modChannelIds.split(' ');}


		// Command handler
		const prefixRegex = new RegExp(
			`^(<@!?${client.user.id}>|${prefix.replace(
				/[.*+?^${}()|[\]\\]/g,
				'\\$&',
			)})\\s*`,
		);

		if (prefixRegex.test(message.content)) {
			const [, match] = message.content.match(prefixRegex);
			const args = message.content.slice(match.length).trim().split(/ +/g);
			const cmd = args.shift().toLowerCase();
			console.log(cmd);
			const command = client.commands.get(cmd) || client.aliases.get(cmd);
			if (disabledCommands.includes(command?.name)) {

				return;
			}
			if (command?.checkPermissions(message)) {

				message.command = true;

				// Create cooldown
				if (command.cooldown) {
					if (!client.cooldowns.has(message.author.id + '-' + command.name)) {
						const date = new Date();
						date.setSeconds(date.getSeconds() + command.cooldown);
						client.cooldowns.set(
							message.author.id + '-' + command.name,
							date,
						);
					}
					else {
						const cooldown = client.cooldowns.get(
							message.author.id + '-' + command.name,
						);
						if (cooldown > Date.now()) {
							return message.channel.send({
								content: `${message.author}, you have to wait ${Math.floor(
									(cooldown - Date.now()) / 1000,
								)} seconds before using this command again.`,
							});
						}
						else {
							const date = new Date();
							date.setSeconds(date.getSeconds() + command.cooldown);
							client.cooldowns.set(
								message.author.id + '-' + command.name,
								date,
							);
						}
					}
				}

				message.lang = language;

				return command.run(message, args, client);

			}
			else if (
				(message.content === `<@${client.user.id}>` ||
          message.content === `<@!${client.user.id}>`) &&
          message.guild.members.me.permissionsIn(message.channel).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])
        && !modChannelIds.includes(message.channel.id)
			) {
				const embed = new EmbedBuilder()
					.setTitle(`Hi, I'm ${message.guild.members.me.displayName}! Need help?`)
					.setThumbnail(client.user.displayAvatarURL())
					.setDescription(
						`You can see everything I can do by using the \`${prefix}help\` command.`,
					)
					.setFields({
						name: 'Invite me',
						value:  `
            You can add me to your server by clicking 
            [here](https://discordapp.com/oauth2/authorize?client_id=${message.guild.members.me.id}&scope=applications.commands%20bot&permissions=8)
          `,

					}, {
						name: 'Support',
						value:`
            If you have questions, suggestions, or found a bug, please join the 
            [${message.guild.members.me.displayName} Support Server](${message.client.supportServerInvite})
          `,

					},
					)

					.setColor(message.guild.members.me.displayHexColor);

				const linkrow = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setLabel('Invite Me')
							.setStyle(ButtonStyle.Link)
							.setURL(
								`https://discordapp.com/oauth2/authorize?client_id=${message.guild.members.me.id}&scope=applications.commands%20bot&permissions=8`,
							)
							.setEmoji('➡'),
					)
					.addComponents(
						new ButtonBuilder()
							.setLabel('Support Server')
							.setStyle(ButtonStyle.Link)
							.setURL(message.client.supportServerInvite || 'https://discord.gg/dae')
							.setEmoji('🛠️'),
					);

				message.channel.send({
					embeds: [embed],
					components: [linkrow],
				});
			}
		}

	},
};
