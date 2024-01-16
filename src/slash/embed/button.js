const Slash = require("../Slash.js");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const { createEmbed, selectRow, editEmbed, formatData, delecteRow, showAllEmbeds } = require('../../utils/databases/embeds.js');

module.exports = class EchoSlash extends Slash {
  constructor(client) {
    super(client, {
      name: "button",
      data: new SlashCommandBuilder()
        .setName("button")
        .setDescription("A")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("addlink")
            .setDescription("Añade un boton de link a un mensaje enviado por algun webhook hecho por el bot.")
            .addStringOption((option) =>
              option
                .setName("message_url")
                .setDescription("URL del mensaje enviado por el webhook")
                .setRequired(true)
            ).addStringOption((option) =>
              option
                .setName("name")
                .setDescription("Texto que saldra en el boton")
                .setRequired(true))
            .addStringOption((option) =>
              option
                .setName("url")
                .setDescription("URL a donde quieres que redirija el mensaje")
                .setRequired(true)
            ).addStringOption((option) =>
              option
                .setName("emoji")
                .setDescription("ID o emoji que deseas usar.")
                .setRequired(false)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove")
            .setDescription("Remueve un boton segun la posicion.")
            .addStringOption((option) =>
              option
                .setName("message_url")
                .setDescription("URL del mensaje enviado por el webhook")
                .setRequired(true)
            ).addStringOption((option) =>
              option
                .setName("number")
                .setDescription("Numero del boton que deseas eliminar, ejemplo: 1 => primer boton")
                .setRequired(true)
                .addChoices(
                  { name: '1', value: '1' },
                  { name: '2', value: '2' },
                  { name: '3', value: '3' },
                  { name: '4', value: '4' },
                  { name: '5', value: '5' }
                )
            )
        )
    });
  }

  async run(interaction, client) {
    const options = interaction.options;
    const type_message = options._subcommand;
    var web = undefined;

    switch (type_message) {
      case "addlink": {
        let message_url = options.getString("message_url");
        let name = options.getString("name");
        let url = options.getString("url");
        let emoji = options.getString("emoji");

        let UrlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;

        const matchURL = url.match(UrlRegex);
        if (!matchURL) return interaction.editReply({ content: "La URL que proporcionaste no es valida." })

        // Check if message_url is something like https://discord.com/channels/1187757312480383097/1187757313205993582/1194879261371277362
        // Create regex
        const regex = /^https:\/\/(?:\w+\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)$/
        const match = message_url.match(regex);
        if (!match) return interaction.editReply({ content: "La URL de mensaje que proporcionaste no es valida." })
        const values = match.slice(1)
        const [guildID, channelID, messageID] = values

        const webhooks = await interaction.guild.fetchWebhooks()

        await webhooks.forEach(async webHok => {
          if (webHok.owner.id === interaction.client.user.id) {
            if (!web) {
              web = webHok;
            } else {
              await webHok.delete()
            }
          }
        })

        if (!web) return interaction.editReply({ content: "No existe ningun webhook creado por el bot en este servidor, primero envia algun mensaje con el bot." })

        try {
          const oldMessage = await web.fetchMessage(messageID)

          if (!oldMessage) throw Error("No podemos :'v")

          const components = oldMessage.components[0] || [];

          const actionRow = new ActionRowBuilder(components.data)

          for (let i = 0; (i < components.components?.length || 0); i++) {
            actionRow.addComponents(components.components[i])
          }

          actionRow.addComponents(new ButtonBuilder()
            .setLabel(name)
            .setStyle(ButtonStyle.Link)
            .setURL(url)
            .setEmoji(emoji)
          )

          if (actionRow.components.length > 5) return interaction.editReply({ content: "Este mensaje ya tiene 5 componentes entre botones y lista, no puedes agregarle mas botones o alguna lista, borra algun boton antes de agregar otro." })

          await web.editMessage(messageID, { components: [actionRow] })

          interaction.editReply({ content: "Mensaje editado" })

        } catch (e) {
          console.log(e)
          return interaction.editReply({ content: "Este mensaje no existe o no fue enviado por el bot." })
        }

        break;

      }
      case "remove": {
        let message_url = options.getString("message_url");
        let number = options.getString("number");


        // Check if message_url is something like https://discord.com/channels/1187757312480383097/1187757313205993582/1194879261371277362
        // Create regex
        const regex = /^https:\/\/(?:\w+\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)$/
        const match = message_url.match(regex);
        if (!match) return interaction.editReply({ content: "La URL de mensaje que proporcionaste no es valida." })
        const values = match.slice(1)
        const [guildID, channelID, messageID] = values

        const webhooks = await interaction.guild.fetchWebhooks()

        await webhooks.forEach(async webHok => {
          if (webHok.owner.id === interaction.client.user.id) {
            if (!web) {
              web = webHok;
            } else {
              await webHok.delete()
            }
          }
        })

        if (!web) return interaction.editReply({ content: "No existe ningun webhook creado por el bot en este servidor, primero envia algun mensaje con el bot." })

        try {
          const oldMessage = await web.fetchMessage(messageID)

          if (!oldMessage) throw Error("No podemos :'v")

          const components = oldMessage.components[0] || [];

          const index = (Number(number) || 1) - 1;

          if(!components.components) return interaction.editReply({ ephemeral: true, content: "Nada, no hay, no existe." })

          if (index > components.components.length) return interaction.editReply({ content: "El número que proporcionaste no es un boton valido." })

          delete components.components[index];

          components.components = components.components.filter(n => n)

          if (components.components.length < 1) await web.editMessage(messageID, { components: [] })
          else await web.editMessage(messageID, { components: [components] })

          interaction.editReply({ content: "Mensaje editado" })

        } catch (e) {
          console.log(e)
          return interaction.editReply({ content: "Este mensaje no existe o no fue enviado por el bot." })
        }

        break;

      }
    }
  }
}

