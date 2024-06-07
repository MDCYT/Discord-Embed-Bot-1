const Slash = require("../Slash.js");
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { selectRow } = require('../../utils/databases/embeds.js');

var web = undefined;
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
        .addSubcommand((subcommand) =>
          subcommand
            .setName("edit")
            .setDescription("Edita un mensaje con el webhook")
            .addStringOption((option) =>
              option
                .setName("url")
                .setDescription("URL del mensaje que deseas editar (Debe ser de un webhook creado por el bot)")
                .setRequired(true)
            )
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Canal en el que deseas editar el mensaje")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("message")
                .setDescription("Aqui puedes poner un mensaje que deseas enviar junto al embed")
                .setRequired(false)
                .setMaxLength(2048)
            )
            .addAttachmentOption((option) =>
              option
                .setName("attachment")
                .setDescription("Aqui puedes poner el archivo que saldra en el mensaje del webhook")
                .setRequired(false)
            )
            .addStringOption((option) =>
              option
                .setName("embed")
                .setDescription("ID del embed que deseas usar")
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
        for await (var embed of embed_id) {
          const embed_Data = (await selectRow(embed.trim()))[0]

          console.log(embed_Data)

          if (embed_Data) {
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

        await webhooks.forEach(async webHok => {
          if (webHok.owner.id === interaction.client.user.id) {
            console.log("Hola papu Bv")
            if (!web) {
              web = webHok;
            } else {
              await webHok.delete()
            }
          }
        })
        if (!web) {
          if (ch.isThread()) {

            web = await ch.parent.createWebhook({
              name: interaction.user.username,
              avatar: interaction.user.avatarURL()
            })
          } else {
            web = await ch.createWebhook({
              name: interaction.user.username,
              avatar: interaction.user.avatarURL()
            })
          }

          // message.reply("Creé un webhook con la ID " + web.id + " - lo podrás usar más tarde para el tercer argumento.")
        }

        // check if ch is a text channel
        if (!ch.isTextBased() && !ch.isThread()) {

          await web.edit({
            channel: ch
          })
        } else if (ch.isThread()) {
          await web.edit({
            channel: ch.parent
          })
        }

        console.log(web)
        try {
          let finalWebhook;
          if (ch.isTextBased() && !ch.isThread()) {
            finalWebhook = await web.send({ embeds, content: message || "", username: username ? username : web.name, avatarURL: avatarUrl ? avatarUrl : web.avatarURL(), files: attachment ? [attachment] : undefined });
          } else {
            finalWebhook = await web.send({ threadId: ch.id, embeds, content: message || "", username: username ? username : web.name, avatarURL: avatarUrl ? avatarUrl : web.avatarURL(), files: attachment ? [attachment] : undefined});
          }

          interaction.editReply(`[Mensaje enviado](https://discord.com/channels/${finalWebhook.guildId}/${finalWebhook.channelId}/${finalWebhook.id})`)

        } catch (error) {
          console.log(error)
          interaction.editReply("No se pudo enviar el mensaje.")
        }
        break;
      };

      case "edit": {
        let url = options.getString("url")
        let ch = options.getChannel("channel")
        let message = options.getString("message")
        let attachment = options.getAttachment("attachment")
        let embed_id = options.getString("embed").split(",")

        const webhooks = await interaction.guild.fetchWebhooks()
        await webhooks.forEach(async webHok => {
          if (webHok.owner.id === interaction.client.user.id) {
            console.log("Hola papu Bv")
            if (!web) {
              web = webHok;
            } else {
              await webHok.delete()
            }
          }
        })
        if (!web) {
          web = await ch.createWebhook({
            name: interaction.user.username,
            avatar: interaction.user.avatarURL()
          })
          // message.reply("Creé un webhook con la ID " + web.id + " - lo podrás usar más tarde para el tercer argumento.")
        }

        console.log({ web })

        // Get the id of the message and get the message from the webhook
        let message_id = url.split("/").pop();
        let webhook = (await ch.messages.fetch(message_id));
        if (webhook.webhookId !== web.id) {
          return interaction.editReply("El mensaje no es de un webhook creado por el bot.")
        }

        // let embeds = [];
        // if (embed) {
        //   const embed_Data = (await selectRow(embed))[0]
        //   if (embed_Data) {
        //     embeds.push(new EmbedBuilder(embed_Data.json));
        //   }
        // }

        // If the user put embed_id, get the embeds, if not, get the embeds from the webhook
        let embeds = [];
        if (embed_id[0]) {
          for await (var embed2 of embed_id) {
            const embed_Data = (await selectRow(embed2.trim()))[0]
            if (embed_Data) {
              embeds.push(new EmbedBuilder(embed_Data.json));
            }
          }
        } else {
          embeds = webhook.embeds
        }

        // If the user dont put message, embed or attachment dont update that part
        if (!message && !embeds[0] && !attachment) {
          return interaction.editReply("No hay nada que editar.")
        }

        try {
          // Only edit the parts that the user put
          await web.editMessage(message_id, { content: message ? message : webhook.content, embeds: embeds ? embeds : webhook.embeds, files: attachment ? [attachment] : undefined })

          interaction.editReply("Mensaje editado.")
        } catch (_error) {
          interaction.editReply("No se pudo editar el mensaje. (Posiblemente el mensaje fue eliminado o no fue enviado por un webhook creado por el bot)")
        }
      }
    }
  }
}

