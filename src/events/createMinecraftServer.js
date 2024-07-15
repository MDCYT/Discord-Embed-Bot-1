const { isServerExists } = require("./updatedMinecraftServer");
const MinecraftConfig = require("../utils/databases/minecraft");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
module.exports = {
  name: "createMinecraftServer",
  once: false,
  /**
   *
   * @param {Client} client
   */
  async execute(client, member, interaction, guild, channel, fields, bedrock) {
    const data = {
      User: {
        id: member.id,
        name: member.user.username,
        avatar: member.user.avatarURL(),
      },
      Java: !bedrock,
      ServerDomain: fields.get("ip").value,
      // ServerPort:  Number(fields.get("port").value || (bedrock ? process.env.BDPORT : process.env.JAVAPORT)),
      ServerPort: isNaN(Number(fields.get("port").value))
        ? bedrock
          ? process.env.BDPORT
          : process.env.JAVAPORT
        : Number(fields.get("port").value),
      ServerName: fields.get("name").value,
      ServerDescription: fields.get("description").value,
      ServerDiscord: fields.get("discord_invite")?.value || "Sin proveer.",
      MessageID: "123",
      ThreadID: "123",
      Accepted: false,
    };

    if (!data.ServerDiscord || data.ServerDiscord.length < 1)
      // if is "",
      data.ServerDiscord = "https://google.com";
    await interaction.deferReply({ ephemeral: true });
    const hasStatus = await isServerExists(
      {
        domain: data.ServerDomain,
        port: data.ServerPort,
      },
      !bedrock
    );
    if (!hasStatus)
      return interaction.editReply({
        content:
          "El servidor dio error al hacerle ping.\nRazones del error:\n- El servidor esta apagado.\n- El servidor no tiene el puerto abierto.\n- El servidor no existe con el dominio.",
      });
    const save = await MinecraftConfig.createMinecraftServer(guild.id, data);
    if (process.env.si !== "si")
      if (save === "no" || save === "error")
        // si si, es si :sob:, weno, si si es... si... Deberia ignorarlo
        return interaction.editReply({
          ephemeral: true,
          content: "Ya existe este servidor.",
        });

    // In that day, alastor say:
    // Im truly honored that we've built such a bund (aw)
    // You're like the child that i wish that i had (uh, what?)
    // I care for you, just like a daughter i spawned (hold on now it)
    // It's little funny, you could almost call me dad
    const embed = new EmbedBuilder()
      .setTitle("Nueva solicitud de servidor")
      .setDescription(
        `**Nombre:** ${data.ServerName}\n**IP:** ${data.ServerDomain}\n**Puerto:** ${data.ServerPort}\n**Descripcion:** ${data.ServerDescription}\n**Discord:** ${data.ServerDiscord}`
      )
      .setColor("Random")
      .setFooter({
        text: "ID: " + data.ServerName + ":" + data.ServerDomain,
        iconURL: interaction.user.avatarURL(),
      });
    const acceptChannelId = (
      await MinecraftConfig.selectMinecraftConfigRow(guild.id)
    )[0].AcceptChannelID;
    const acceptChannel = guild.channels.cache.get(acceptChannelId);
    console.log(acceptChannelId, acceptChannel);
    if (!acceptChannel) return; // if the channel is not found, return
    const message = await acceptChannel.send({
      content: "nuevo server.",
    });
    const buttonToAccept = new ButtonBuilder()
      .setLabel("Aceptar")
      .setCustomId(
        "acceptMinecraftServer=" +
          data.ServerDomain +
          "," +
          data.ServerPort +
          "," +
          message.id +
          "," +
          message.channel.id
      )
      .setStyle(ButtonStyle.Success)
      .setEmoji("✅");
    const buttonToReject = new ButtonBuilder()
      .setLabel("Rechazar")
      .setCustomId(
        "rejectMinecraftServer=" +
          data.ServerDomain +
          "," +
          data.ServerPort +
          "," +
          message.id +
          "," +
          message.channel.id
      )
      .setStyle(ButtonStyle.Danger)
      .setEmoji("❌");
    const row = new ActionRowBuilder().addComponents(
      buttonToAccept,
      buttonToReject
    );
    message.edit({
      content: "",
      embeds: [embed],
      components: [row],
    });
    interaction.editReply({
      content: "Se envio para la lista de comprobacion correctamente 👍.",
    });
  },
  async accept(ip, port, guild) {
    const serverConfig = await MinecraftConfig.selectMinecraftConfigRow(
      guild.id
    );
    const channel = guild.channels.cache.get(serverConfig[0].ChannelID);
    const data = await MinecraftConfig.selectMinecraftServerRow(
      guild.id,
      ip,
      port
    );
    if (!data) return { content: "No se encontro el servidor." };

    const post = await channel.threads.create({
      name: data.ServerName + ` [${data.ServerDomain}]`,
      autoArchiveDuration: 1440,
      message: {
        content: "loading...",
      },
    });
    await post.setAppliedTags([
      data.Java ? serverConfig[0].JavaTagID : serverConfig[0].BedrockTagID,
    ]);
    data.ThreadID = post.id;
    // get first message
    const messages = await post.messages.fetch();
    const message = messages.first();
    data.MessageID = message.id;

    guild.client.emit("updatedMinecraftServer", data, guild, async () => {
      await MinecraftConfig.editMinecraftServer(guild.id, data);
    });
    return { content: "Se acepto correctamente el servidor.", user: data.User };
  },
  async delete(ip, port, guild) {
    const data = await MinecraftConfig.selectMinecraftServerRow(
      guild.id,
      ip,
      port
    );
    if (!data) return { content: "No se encontro el servidor." };
    await MinecraftConfig.deleteMinecraftServerRow(guild.id, ip, port);
    return {
      content: "Se rechazo correctamente el servidor.",
      user: data.User,
    };
  },
};
