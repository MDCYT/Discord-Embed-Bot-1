const Slash = require("../Slash.js");
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { selectRow } = require('../../utils/databases/embeds.js');

module.exports = class EchoSlash extends Slash {
  constructor(client) {
    super(client, {
      name: "webhook",
      data: new SlashCommandBuilder()
        .setName("webhook")
        .setDescription("A")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("send")
            .setDescription("Envia un embed con el webhook")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Canal en el que deseas enviar el mensaje")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("id")
                .setDescription("ID del embed que deseas usar")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("message")
                .setDescription("Aqui puedes poner un mensaje que deseas enviar junto al embed")
                .setRequired(false)
                .setMaxLength(2048)
            )
            .addStringOption((option) =>
              option
                .setName("username")
                .setDescription("Aqui puedes poner el nombre de usuario que saldra en el webhook")
                .setRequired(false)
                .setMinLength(3)
                .setMaxLength(32)
            )
            .addAttachmentOption((option) =>
              option
                .setName("avatar")
                .setDescription("Aqui puedes poner el avatar que saldra en el webhook")
                .setRequired(false)


            )
        )
    });
  }

  async run(interaction, client) {
    const options = interaction.options;
    const type_message = options._subcommand;

    switch (type_message) {
      case "send": {
        let embed_id = options.getString("id");
        let ch = options.getChannel("channel");
        let username = options.getString("username") || interaction.user.username
        let avatar = options.getAttachment("avatar")
        var avatarUrl = "";
        if (avatar && avatar.contentType === "image/png") {
          avatarUrl = avatar.url;
        }
        let message = options.getString("message")


        const webhooks = await interaction.guild.fetchWebhooks()
        //if (webhook) webhook = webhook.toLowerCase();
        const embed_Data = await selectRow(embed_id)

        if (!embed_Data[0])
          return message.reply(`Can't find embed with ID: ${embed_id}, please use \`/embed create ${embed_id}\` to create the embed with this ID`)

        /*if (webhook.startsWith("https://discord.com/api/webhooks/")) {
            webhook = webhook.split("/")[5]; // resolve link
            client.logger.info(webhook + " result ID");
        }*/

        var web = undefined;

        await webhooks.forEach(async webHok => {
          if (webHok.owner.id === interaction.client.user.id) {
            if (!web) {
              web = webHok;
            } else {
              await webHok.delete()
            }
          }
        })
        if (!web) {
          web = await ch.createWebhook({
            name: username,
            avatar: avatarUrl ? avatarUrl : interaction.client.user.avatarURL()
          })
          // message.reply("Creé un webhook con la ID " + web.id + " - lo podrás usar más tarde para el tercer argumento.")
        }
        const embed = new EmbedBuilder(embed_Data[0].json)
        await web.edit({
          channel: ch
        })
        const finalWebhook = await web.send({ embeds: [embed], content: message || "", username: username ? username : web.name, avatarURL: avatarUrl ? avatarUrl : web.avatar });
        interaction.editReply(`[Mensaje enviado](https://discord.com/channels/${finalWebhook.guildId}/${finalWebhook.channelId}/${finalWebhook.id})`)

      };

    }
  }
}

