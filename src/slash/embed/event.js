const Slash = require("../Slash.js");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const { createEmbed, selectRow, editEmbed, formatData, delecteRow, showAllEmbeds } = require('../../utils/databases/embeds.js');

module.exports = class EchoSlash extends Slash {
  constructor(client) {
    super(client, {
      name: "event",
      data: new SlashCommandBuilder()
        .setName("event")
        .setDescription(":v")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
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
            .setName("remove")
            .setDescription("Remueve un evento")
            .addStringOption((option) =>
              option
                .setName("id")
                .setDescription("La ID del evento")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("help")
            .setDescription("Revisa las funciones de edit")
       
            
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add_send_message")
            .setDescription("Añade las funciones send message")
            .addStringOption((option) =>
              option
                .setName("id")
                .setDescription("La ID del evento")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("content")
                .setDescription("El contenido del mensaje")
                .setRequired(false)
            )
             .addStringOption((option) =>
              option
                .setName("embeds")
                .setDescription("Los embeds que va a mandar el bot (separa por comas ej: 1,2,3)")
                .setRequired(false)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add_role")
            .setDescription("Añade las funciones add role")
            .addStringOption((option) =>
              option
                .setName("id")
                .setDescription("La ID del evento")
                .setRequired(true)
            )
            .addRoleOption((option) =>
              option
                .setName("role")
                .setDescription("El rol en cuestión")
                .setRequired(true)
              )
            
        )
         .addSubcommand((subcommand) =>
          subcommand
            .setName("remove_send_message")
            .setDescription("Añade las funciones send message")
            .addStringOption((option) =>
              option
                .setName("id")
                .setDescription("La ID del evento")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove_role")
            .setDescription("Añade las funciones add role")
            .addStringOption((option) =>
              option
                .setName("id")
                .setDescription("La ID del evento")
                .setRequired(true)
            )
  
        )
    });
  }

  async run(interaction, client) {
    const options = interaction.options;
    const type_message = options._subcommand;
    var id = options.getString("id");
    const ajskldsa =  await events.selectRow(id);
    const web =ajskldsa[0];
    console.log(ajskldsa);
    console.log(web); 
    switch(type_message) {
    case "remove_role":
    case "add_role": {
             if (!web) {
          const embed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription("Este evento no existe")
          .setThumbnail(interaction.client.user.avatarURL())

          interaction.editReply({
            embeds: [embed]
          })

          return;
    }
      var allEvents = web.events;
      const type = "add_role"
      const role = options.getRole("role")

      var otherEvents = allEvents.filter(e => e.type !== type);
      if (type_message === "add_role")
      otherEvents.push({id: role.id, type})
      interaction.editReply({content: "evento editado", ephemeral: true});
      events.updateRow(id, otherEvents);


      break;
    }
  case "remove_send_message":
    case "add_send_message": {
       if (!web) {
          const embed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription("Este evento no existe")
          .setThumbnail(interaction.client.user.avatarURL())

          interaction.editReply({
            embeds: [embed]
          })

          return;
    }
      const type = "snd_msg"

      var allEvents = web.events;
      var otherEvents = allEvents.filter(e => e.type !== type);

      const content =  options.getString("content");
      const _embeds =  (options.getString("embeds") || "").split(",");
      const embeds = [];
      if (_embeds) {
          _embeds.forEach(embed => {
            embeds.push(embed.trim());
          })
      }
      if (type_message !== "remove_send_message")
      otherEvents.push({type, content,embeds})
      events.updateRow(id, otherEvents);
      interaction.editReply({content: "evento editado", ephemeral: true});
      break;
    }
    case "help": {

        const embed = new EmbedBuilder()
        .setTitle("Todos los comandos de edit")
        .setDescription(
          `1. \`/embed add_role\` - añade el evento añadir rol, donde añade un rol al usuario al interaccionar\n`
          +`2. \`/embed remove_role\` - remueve el evento añadir rol\n`
          +`3. \`/embed add_send_message\` - añade el evento "send message", que solo manda mensaje\n`
          +`4. \`/embed remove_send_message\` - remueve el evento "send message"\n`
          )
        .setThumbnail(client.user.avatarURL())

        interaction.editReply({
          embeds: [embed]
        })

      break;
    }
  case "remove": {
    if (!web) {
          const embed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription("Este evento no existe")
          .setThumbnail(interaction.client.user.avatarURL())

          interaction.editReply({
            embeds: [embed]
          })

          return;
    }
    await events.deleteRow(id);
 const embed = new EmbedBuilder()
          .setTitle("Borrado correctamente")
          .setDescription("Se ha borrado correctamente el evento `"  + id  + "` de mi lista de eventos disponibles.")
          .setThumbnail(interaction.client.user.avatarURL())

          interaction.editReply({
            embeds: [embed]
          })

          return;

  }
      case "add": {
        if (!id)
          id = uuidv4()

        console.log(id);
        if (web) {
          const embed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription("Este evento ya existe")
          .setThumbnail(interaction.client.user.avatarURL())

          interaction.editReply({
            embeds: [embed]
          })

          return;
        }
    }
    const ev = await events.insertRow(id, [
    {
      name: "snd_msg",
      type: "snd_msg",
      data: {
          content: "Not implement."
        },
      referID: id
    }
      ]);
     const embed = new EmbedBuilder()
          .setTitle("Evento creado")
          .setDescription("Este evento se creo correctamente, usa /event help para ver la lista de funciones que puedes usar\nID: `" + id + "`")
          .setThumbnail(interaction.client.user.avatarURL())

          interaction.editReply({
            embeds: [embed]
          })
        break;
      }
    }


  }


