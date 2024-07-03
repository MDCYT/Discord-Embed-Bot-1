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
const fs = require('fs');
const path = require('path');

const OpenAI = require('openai');

const { createNewChat, getChatsByID } = require('../utils/databases/chatia.js');

const configuration = new OpenAI.Configuration({
	organization: process.env.OPENAI_ORG_ID,
	apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAI.OpenAIApi(configuration);

// Make a map for cooldowns
const cooldowns = new Map();

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
							stripIndents`
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
		if (typeof disabledCommands === 'string') { disabledCommands = disabledCommands.split(' '); }

		if (typeof modChannelIds !== 'string') modChannelIds = [];
		if (typeof modChannelIds === 'string') { modChannelIds = modChannelIds.split(' '); }


		// Command handler
		const prefixRegex = new RegExp(
			`^(${prefix.replace(
				/[.*+?^${}()|[\]\\]/g,
				'\\$&',
			)})\\s*`,
		);

		if (prefixRegex.test(message.content)) {
			const [, match] = message.content.match(prefixRegex);
			const args = message.content.slice(match.length).trim().split(/ +/g);
			const cmd = args.shift().toLowerCase();
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
		} else if (
			(message.mentions.users.has(message.client.id) || message.mentions.users.has(client.id)) && (process.env.AI_CHANNEL.split(',').includes(message.channel.id) || process.env.AI_CHANNEL.split(',').includes(message.channel.parentId))
		) {
			console.log("AI")
			//Check if the user is on cooldown
			if (cooldowns.has(message.author.id) && Date.now() - cooldowns.get(message.author.id) < 1000 * 60 * parseInt(process.env.AI_COOLDOWN)) {
				return await message.reply('Espera <t:' + Math.floor((cooldowns.get(message.author.id) + 1000 * 60 * parseInt(process.env.AI_COOLDOWN)) / 1000) + ':R> antes de hacer otra pregunta.');
			}

			//Set the user on cooldown
			cooldowns.set(message.author.id, Date.now());

			var prompt = message.content;

			try {
				const responseModeration = await openai.createModeration({
					engine: "text-moderation-latest",
					input: prompt
				});
				const respuestas = ["No puedo responder a eso.", "No deberias preguntar eso.", "No tengo respuesta para eso."];
				//Send the response if it is not safe
				if (responseModeration.data.results[0].categories.hate || responseModeration.data.results[0].categories['hate/threatening']) {
					return await message.reply(respuestas[Math.floor(Math.random() * respuestas.length)]);
				}
				//Replace all mentions like <@!123456789> with the username
				prompt = prompt.replace(/<@!?[0-9]+>/g, (match) => {
					const id = match.replace(/<@!?/, '').replace(/>/, '');
					const user = message.client.users.cache.get(id);
					return user ? user.username : match;
				});
				//Replace all mentions like <@&123456789> with the role name
				prompt = prompt.replace(/<@&[0-9]+>/g, (match) => {
					const id = match.replace(/<@&/, '').replace(/>/, '');
					const role = message.guild.roles.cache.get(id);
					return role ? role.name : match;
				});
				//Replace all mentions like <#123456789> with the channel name
				prompt = prompt.replace(/<#[0-9]+>/g, (match) => {
					const id = match.replace(/<#/, '').replace(/>/, '');
					const channel = message.guild.channels.cache.get(id);
					return channel ? channel.name : match;
				});

				const inputSystem = fs.readFileSync(path.join(__basedir, 'src', 'utils', 'inputSystem.txt'), 'utf8').replace("%%AUTHOR%%", message.author.username).replace("%%CHANNEL_NAME%%", message.channel.name).replace("%%CHANNEL_TOPIC%%", message.channel.topic || "No hay topico definido")
				let lastMessages = (await getChatsByID(message.author.id + "-" + message.client.user.id, 20)).reverse();

				let AIPersonality = fs.readFileSync(path.join(__basedir, 'src', 'utils', 'AIPersonality.json'), 'utf8')
				AIPersonality = JSON.parse(AIPersonality);
				const response = await openai.createChatCompletion({
					model: "gpt-3.5-turbo",
					messages: [
						{ "role": "system", "content": inputSystem },
						...AIPersonality,
						...lastMessages,
						{ "role": "user", "content": prompt },
					],
					user: message.author.username,
					temperature: 1.2,
					//If the user is boosting the server, we give them more tokens
					max_tokens: message.member.premiumSince ? 150 : 75,
				});
				await message.reply(response.data.choices[0].message.content || 'No tengo idea de lo que estas hablando.');
				await createNewChat(message.author.id + "-" + message.author.id, "user", prompt);
				await createNewChat(message.author.id + "-" + message.author.id, "assistant", response.data.choices[0].message.content);

				return;
			} catch (error) {
				console.log(error);
				return await message.reply('Ocurrio un error al intentar responder a tu pregunta.');
			}
		}
	},
};
