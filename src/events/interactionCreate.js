const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,Interaction, ThreadChannel, TextChannel, ButtonBuilder, ButtonStyle } = require("discord.js")
const MinecraftConfig = require("../utils/databases/minecraft")
const util = require('minecraft-server-util');

/**
 * 
 * @param {{
 * GuildID: string,
 * ThreadID: string,
 * ServerDomain: string,
 * ServerPort: number,
 * ServerName: string,
 * ServerDescription: string,
 * ServerDiscord: string,
 * Java: boolean,
 * 
 * }} serverValues
 * @param {boolean} create
 * 
 */
async function getMinecraftInfoByServer(serverValues,interaction) {
  const status = serverValues.Java ? util.status : util.statusBedrock;
  var serverStatus = undefined;
  const embed = new EmbedBuilder()
  try {
    if (serverValues.ServerPort > 0 && serverValues.ServerPort <= 65535) 
      serverStatus = await status(serverValues.ServerDomain, serverValues.ServerPort )
    else
      serverStatus = await status(serverValues.ServerDomain, undefined) // why?

  } catch(err) {
    embed
    .setTitle(`Error al conectar al servidor ${serverValues.ServerName}`)
    .setAuthor({
      iconURL: interaction.member.displayAvatarURL({size: 1024}),
      name: interaction.member.displayName
    })
    .setFields({
      name: "Error",
      value: String(err).slice(0, 1024)
    })
    return {embeds: [embed], isError: true, serverStatus: undefined}
  }
  const imageBuffer = Buffer.from(await fetch(serverStatus.favicon).then(res => res.arrayBuffer()))
  const client = interaction.client;
  const iconsChannel =client.guilds.cache.get(process.env.GUILD_ID).channels.cache.get(process.env.ICONCH)
  const messageWithImage = await iconsChannel.send({
      files: [{
          attachment: imageBuffer,
          name: 'image.png'
      }]
  });
  const imageUrl = messageWithImage.attachments.first().url;
  const embeds = [embed]
  if (serverValues.Java) {
    const url = `https://sr-api.sfirew.com/server/${serverValues.ServerDomain}/banner/motd.png`
    const bannerEmbed = new EmbedBuilder()
    .setImage(url)
    .setColor("Red")
    embeds.push(bannerEmbed)
  }
  if (imageUrl)
    embed.setThumbnail(imageUrl)

  embed.setTitle(serverValues.ServerName)
  .setDescription(serverValues.ServerDescription)
  .setAuthor({
    iconURL: interaction.member.displayAvatarURL({size: 1024}),
    name: interaction.member.displayName
  })
  .setFields({
    name: "IP",
    value: `\`\`\`ini\n${serverValues.ServerDomain}${serverValues.ServerPort !== 0 ? `:${serverValues.ServerPort}` : ''}\`\`\``
  }, {
    name: "version",
    value: `\`\`\`ini\n${serverStatus.version.name==='§f'? "Version Multiple" : serverStatus.version.name}\`\`\``
  }, {
    name: "Players",
    value: `\`\`\`ini\n${serverStatus.players.online} / ${serverStatus.players.max} (${Math.floor((serverStatus.players.online / serverStatus.players.max ) * 100) }%)\`\`\``,
  })
  .setColor("Red")
  const components = [];
  if (serverValues.ServerDiscord && serverValues.ServerDiscord.length > 0 && serverValues.ServerDiscord.includes("discord")) {
    if (!serverValues.ServerDiscord.startsWith("https://"))
      serverValues.ServerDiscord = "https://" + serverValues.ServerDiscord
    components.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Discord").setStyle(5).setURL(serverValues.ServerDiscord)))
  }
  return {embeds, isError: false, serverStatus,components}
}
module.exports = {
  name: "interactionCreate",
  /**
   * 
   * @param {Interaction} interaction 
   * @param {*} client 
   * @returns 
   */
  async execute(interaction, client) {
    this.onCustomEv = async (id) => {
      const event = (await events.selectRow(id))[0].events;
      for (let ev of event) {
        switch (ev.type) {
          case "snd_msg": {
            var embeds = [];
            if (ev.embeds) {
              for (let embed of ev.embeds) {
                const embedData = (await global.embeds.selectRow(embed))[0]
                if (embedData)
                  embeds.push(new EmbedBuilder(embedData.json))
              }
            }
            if (ev.channel === "hidden") {
              interaction.reply({
                ephemeral: true,
                content: ev.content,
                embeds
              })
            } else {
              //Send to user in DM
              await (await interaction.user.createDM()).send({
                content: ev.content,
                embeds
              })
              interaction.reply({
                ephemeral: true,
                content: ev.channelmessage
              })
            }

            break;
          }
          case "add_role": {

            const id_rol = ev.id

            if (interaction.member.roles.cache.some(role => role.id === ev.id)) {
              interaction.member.roles.remove(id_rol)
              return interaction.reply({ ephemeral: true, content: "Rol removido" })
            }
            else {
              interaction.member.roles.add(id_rol)
              return interaction.reply({ ephemeral: true, content: "Rol añadido" })
            }
          }
        }
      }

    }
    if (interaction.customId) {
        if (interaction.customId.startsWith("peso_pluma_le_dice_a_la_pomni")) {

        const [guildId, type, userId] = interaction.customId.slice("peso_pluma_le_dice_a_la_pomni=".length, interaction.customId.length).split(",")
        const serverValues = {
          GuildID: guildId,
          ThreadID: interaction.channel.id,
          ServerDomain: interaction.fields.fields.get("ip").value,
          ServerPort: Number(interaction.fields.fields.get("port")?.value || 0),
          ServerName: interaction.fields.fields.get("name").value,
          ServerDescription: interaction.fields.fields.get("description").value,
          ServerDiscord: interaction.fields.fields.get("discord_invite")?.value ?? "",
          Java: type === "java"
        }
      /**
       * @type {TextChannel} 
       */
      const channel = interaction.channel.parent;
        
        
    
      const data = await getMinecraftInfoByServer(serverValues, interaction)
      if (data.isError) {
        delete data.isError;
        delete data.serverStatus;
        interaction.reply({ ephemeral: true, ...data})
        return;
      }
      delete data.isError;
      delete data.serverStatus;

        const post = await channel.threads.create({
          name: serverValues.ServerName  + ` [${serverValues.ServerDomain}]`,
          autoArchiveDuration: 1440,
          message: {
            ...data,
          }
          
        });

        serverValues.ThreadID = post.id;
        
        console.log(`ola` );
        interaction.reply({ ephemeral: true, content: "Server creado en " + `<#${post.id}>`})
      }
      // creating new minecraft server at the command interaction
      // new-minecraft-{type=java/bedrock}-{guildId=string we}
      console.log(interaction.customId)
      if (interaction.customId.startsWith("new-minecraft")) {
        interaction.customId= interaction.customId.slice("new-minecraft-".length, interaction.customId.length)
        const [type, guildId] = interaction.customId.split("-")
        if (!guildId) return interaction.reply({ ephemeral: true, content: "Error, bad custom Id otorged" })
        if (!type) return interaction.reply({ ephemeral: true, content: "Error, bad custom Id otorged" })
        // show a modal of testing, just asking for two things, "hi": string, "don pollo si o no": "string"
        
        const modal =new ModalBuilder()
        .setTitle("Minecraft Server | Interfaz")
        .setCustomId(`peso_pluma_le_dice_a_la_pomni=${guildId},${type},${interaction.user.id}`)
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
            .setRequired(true)
            .setCustomId("ip")
            .setMinLength(7)
            .setMaxLength(256) // i forget the ip can be mc.hypixel.net
            .setLabel("Ip del servidor")
            .setStyle(TextInputStyle.Short)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
            .setRequired(false)
            .setCustomId("port")
            .setPlaceholder("Si no tienes puerto, dejalo en blanco")
            .setMaxLength(5)
            .setLabel("Puerto del servidor")
            .setStyle(TextInputStyle.Short)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
            .setRequired(true)
            .setCustomId("name")
            .setMaxLength(64)
            .setLabel("Nombre del servidor")
            .setStyle(TextInputStyle.Short)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
            .setRequired(true)
            .setCustomId("description")
            .setMaxLength(2048)
            .setLabel("Descripción del servidor")
            .setStyle(TextInputStyle.Paragraph)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
            .setRequired(false)
            .setCustomId("discord_invite")
            .setMaxLength(128)
            .setLabel("Invitacion de discord (OPCIONAL)")
            .setStyle(TextInputStyle.Short)
          ),
        )  

        interaction.showModal(modal)
      }
      if (interaction.customId.startsWith("customevents_:")) {
        const id = interaction.customId.slice("customevents_:".length, interaction.customId.length)
        this.onCustomEv(id);
        return;
      }
    }
    if (interaction.values) {
      if (interaction.values[0].startsWith("customevents_:")) {
        const id = interaction.values[0].slice("customevents_:".length, interaction.values[0].length)
        this.onCustomEv(id);
        return;
      }
    }
    if (!interaction.isCommand()) return;

    const command = interaction.client.slashes.get(interaction.commandName);

    if (!command) {
      return interaction.reply({
        content: "That command doesn't exist!",
        ephemeral: true,
      });
    }
    await interaction.deferReply();

    try {
      await command.run(interaction, client);
    } catch (e) {
      interaction.client.logger.error(e.stack);

      await interaction.editReply({
        content: "An error occured while executing that command!",
        ephemeral: true,
      });
    }
  },
};
