const Command = require('../Command.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = class GitHubCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'github',
			aliases: ['gh', 'repo'],
			usage: 'github',
			description: 'Displays the link to Any Bot\'s GitHub repository.',
			type: client.types.INFO,
		});
	}
	run(message) {
		const embed = new EmbedBuilder()
			.setTitle('GitHub Link')
			.setThumbnail(message.client.user.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setDescription(`
        Click [here](https://github.com/sabattle/CalypsoBot) to go to the original repository from which Any Bot was created (Calypso Bot)!
        Click [here](https://github.com/MDCYT/Any-Bot) to go to the Any Bot repository!
        Please support me by starring ⭐ the repo, and feel free to comment about issues or suggestions!
      `)
	  .setFields({
		name: "Other links",
		value: `**[Invite Me](https://discordapp.com/oauth2/authorize?client_id=${message.client.user.id}&scope=bot%20applications.commands&permissions=8) | ` +
        `[Support Server](${message.client.supportServerInvite})**`,
	  })
			
			.setFooter({
				text: message.member.displayName,
				iconURL: message.author.displayAvatarURL({ dynamic: true }),
			})
			.setTimestamp()
			.setColor(message.guild.members.me.displayHexColor);

		const linkrow = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setLabel('Github')
					.setStyle(ButtonStyle.Link)
					.setURL('https://github.com/MDCYT/Any-Bot') // TODO: CHANGE THIS
					.setEmoji('⭐'),
				new ButtonBuilder()
					.setLabel('Invite Me')
					.setStyle(ButtonStyle.Link)
					.setURL(`https://discordapp.com/oauth2/authorize?client_id=${message.client.user.id}&scope=bot%20applications.commands&permissions=8`)
					.setEmoji('🔗'),
				new ButtonBuilder()
					.setLabel('Support Server')
					.setStyle(ButtonStyle.Link)
					.setURL(message.client.supportServerInvite || "https://discord.gg/dae")
					.setEmoji('🛡'),

			);
		message.channel.send({ embeds:[embed], components: [linkrow] });
	}
};