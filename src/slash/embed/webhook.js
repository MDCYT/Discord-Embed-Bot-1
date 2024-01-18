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
                .setDescription("ID o ID's del embed que deseas usar")
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
            .addAttachmentOption((option) =>
              option
                .setName("attachment")
                .setDescription("Aqui puedes poner el archivo que saldra en el mensaje dcel webhook")
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
        let embed_id = options.getString("id").split(",");
        let ch = options.getChannel("channel");
        let username = options.getString("username") || interaction.user.username
        let avatar = options.getAttachment("avatar")
        
        let attachment = options.getAttachment("attachment")

        var avatarUrl = "";
        if (avatar && avatar.contentType === "image/png") {
          avatarUrl = avatar.url;
        }
        let message = options.getString("message")


        const webhooks = await interaction.guild.fetchWebhooks()
        
        let embeds = [];
        for await (var embed of embed_id){
          const embed_Data = (await selectRow(embed.trim()))[0]

          console.log(embed_Data)

          if(embed_Data) {
            embeds.push(new EmbedBuilder(embed_Data.json));
          }
            
          }
        console.log(embeds)
        if (!embeds[0] && !message && !attachment)
          return interaction.editReply(`No hay embeds, verifica que la ID o ID's son correctas.`)

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
        await web.edit({
          channel: ch
        })
        console.log(attachment)
        const finalWebhook = await web.send({ embeds, content: message || "", username: username ? username : web.name, avatarURL: avatarUrl ? avatarUrl : web.avatar, files: attachment ? [attachment]: undefined });
        interaction.editReply(`[Mensaje enviado](https://discord.com/channels/${finalWebhook.guildId}/${finalWebhook.channelId}/${finalWebhook.id})`)

      };

    }
  }
}

