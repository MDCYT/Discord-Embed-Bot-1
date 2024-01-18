const Slash = require("../Slash.js");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, SlashCommandBuilder } = require('discord.js');
const { v4: uuidv4 } = require('uuid');

module.exports = class EchoSlash extends Slash {
  constructor(client) {
    super(client, {
      name: "selectlist",
      data: new SlashCommandBuilder()
        .setName("select_list")
        .setDescription(":v")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("create")
            .setDescription("Crea un evento.")
            .addStringOption((option) =>
              option
                .setName("id")
                .setDescription("otorgale una ID al evento")
                .setRequired(false)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove_to_list")
            .setDescription("Crea un evento.")
            .addStringOption((option) =>
              option
                .setName("id")
                .setDescription("ID de la lista")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("index")
                .setDescription("ID de la lista")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add_to_list")
            .setDescription("Crea un evento.")
            .addStringOption((option) =>
              option
                .setName("id")
                .setDescription("ID de la lista")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("event_id")
                .setDescription("ID de la lista")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("title")
                .setDescription("titulo")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("description")
                .setDescription("descripción")
                .setRequired(false)
            )
            .addStringOption((option) =>
              option
                .setName("emoji")
                .setDescription("momoji")
                .setRequired(false)
            )
        ).addSubcommand((subcommand) =>
          subcommand
            .setName("set_message")
            .setDescription("Añade un boton de link a un mensaje enviado por algun webhook hecho por el bot.")
            .addStringOption((option) =>
              option
                .setName("message_url")
                .setDescription("URL del mensaje enviado por el webhook")
                .setRequired(true)
            ).addStringOption((option) =>
              option
                .setName("id")
                .setDescription("Texto que saldra en el boton")
                .setRequired(true)
            )
        )

    });
  }

  async run(interaction) {
    const options = interaction.options;
    const type_message = options._subcommand;
    var id = options.getString("id");
    const eventData = await menu.selectRow(id);
    var web = undefined;

    switch (type_message) {
      case "set_message": {
        let message_url = options.getString("message_url");

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
          const baseComponents = oldMessage.components || []
          const components = [];

          baseComponents.forEach(o => {
            o.forEach(e => {
              if (e.customId !== "list" && !components.includes(o)) {
                components.push(o);
              }
            })
          })
          const list = (await menu.selectRow(id))[0]

          if (list) {
            const options = [];
            (list.events || []).forEach(option => {
              const desc = option.description ? { description: option.description } : {};
              const emoji = option.emoji ? { emoji: option.emoji } : {};
              options.push({
                ...desc,
                ...emoji,
                label: option.title,
                value: `customevents_:${option.event_id}`,
              })
            })
            const swagMenu = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('list')
                .setPlaceholder('Selecciona una opcion')
                .addOptions(options)
            );
            components.push(swagMenu);
          } // Agregamos esta llave que faltaba

          await web.editMessage(messageID, { components })

          interaction.editReply({ content: "Mensaje editado" })
        } catch (e) {
          console.log(e)
          return interaction.editReply({ content: "Este mensaje no existe o no fue enviado por el bot." })
        }


        break;

      }
      case "remove_to_list": {

        var index = options.getString("index");
        if (isNaN(Number(index)))
          index = 1;

        if (!eventData[0]) {
          const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Este evento no existe")
            .setThumbnail(interaction.client.user.avatarURL())

          interaction.editReply({
            embeds: [embed]
          })

          return;
        }
        eventData[0].events.splice(index - 1, 1)
        await menu.updateRow(id, eventData[0].events)
        interaction.editReply({ content: "Se removió de la lista" })
        break;
      }
      case "create": {
        if (!id)
          id = uuidv4();

        if (eventData[0]) {
          const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Este evento ya existe")
            .setThumbnail(interaction.client.user.avatarURL())

          interaction.editReply({
            embeds: [embed]
          })

          return;
        }
        await menu.insertRow(id, [])
        interaction.editReply({ content: "Se creo la lista con la ID: " + id })

        break;

      }
      case "add_to_list": {
        if (!eventData[0]) {
          const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Este evento ya existe")
            .setThumbnail(interaction.client.user.avatarURL())

          interaction.editReply({
            embeds: [embed]
          })

          return;
        }
        const title = options.getString("title");
        const description = options.getString("description")
        const emoji = options.getString("emoji")
        const event_id = options.getString("event_id")
        const po = eventData[0].events || [
          {
            title: "Titulo vacio",
            description: "Descripcion vacio",
            event_id: "undefined",
          }];
        po.push({ title, description, emoji, event_id })
        await menu.updateRow(id, po)
        interaction.editReply({ content: "Se añadio de la lista" })

        break;
      }
    }
  }
}