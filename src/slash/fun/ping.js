const { SlashCommandBuilder } = require("@discordjs/builders");
const Slash = require("../Slash.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class EchoSlash extends Slash {
  constructor(client) {
    super(client, {
      name: "ping",
      data: new SlashCommandBuilder().setName("ping").setDescription("Pong!"),
    });
  }

  async run(interaction) {
    const time = Date.now();

    const latency = `\`\`\`ini\n[ ${Math.floor(Date.now() - time)}ms ]\`\`\``;
    const apiLatency = `\`\`\`ini\n[ ${Math.round(
      interaction.client.ws.ping
    )}ms ]\`\`\``;
    const embed = new EmbedBuilder()
      .setTitle(`Pong!`)
      .addFields({
        name: "Latency",
        value: latency,
        inline: true,
      },
        {
          name: "API Latency",
          value: apiLatency,
          inline: true,
        })
      .setFooter({
        text: interaction.member.displayName,
        iconURL: interaction.member.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();
    interaction.editReply({
      embeds: [embed],
    });
  }
};
