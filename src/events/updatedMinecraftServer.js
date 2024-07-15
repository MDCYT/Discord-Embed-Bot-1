const {
  Client,
  EmbedBuilder,
  Guild,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const {
  MinecraftServer,
  selectMinecraftConfigRow,
} = require("../utils/databases/minecraft");
const util = require("minecraft-server-util");


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
async function getMinecraftInfoByServer(serverValues, user, client) {
  const status = serverValues.Java ? util.status : util.statusBedrock;
  var serverStatus = undefined;
  const embed = new EmbedBuilder().setAuthor({
    iconURL: user.avatar,
    name: user.name,
  });
  try {
    if (serverValues.ServerPort > 0 && serverValues.ServerPort <= 65535)
      serverStatus = await status(
        serverValues.ServerDomain,
        serverValues.ServerPort
      );
    else serverStatus = await status(serverValues.ServerDomain, undefined); // why?
  } catch (err) {
    embed
      .setTitle(`Error al conectar al servidor ${serverValues.ServerName}`)

      .setFields({
        name: "Error",
        value: String(err).slice(0, 1024),
      });
    return { embeds: [embed], isError: true, serverStatus: undefined, message: `${process.env.minecraft_emoji_message} ${serverStatus.players.online} / ${serverStatus.players.max}` };
  }
  const imageBuffer = Buffer.from(
    await fetch(serverStatus.favicon).then((res) => res.arrayBuffer())
  );
  const serverConfig = (
    await selectMinecraftConfigRow(serverValues.GuildID)
  )[0];
  const iconsChannel = client.guilds.cache
    .get(serverValues.GuildID)
    .channels.cache.get(serverConfig.AcceptChannelID);
  const messageWithImage = await iconsChannel.send({
    content:
      "Ignora este mensaje. Se necesita para sacar el icono del servidor.",
    files: [
      {
        attachment: imageBuffer,
        name: "image.png",
      },
    ],
  });
  const imageUrl = messageWithImage.attachments.first().url;
  const embeds = [embed];
  if (serverValues.Java) {
    const url = `https://sr-api.sfirew.com/server/${serverValues.ServerDomain}/banner/motd.png`;
    const bannerEmbed = new EmbedBuilder().setImage(url).setColor("Red");
    embeds.push(bannerEmbed);
  }
  if (imageUrl) embed.setThumbnail(imageUrl);
  var isDefaultPort = function (port) {
    return port === 25565 || port === 19132;
  };
  const vars = [
    {
      name: "🔺 IP",
      value: `\`\`\`ini\n${serverValues.ServerDomain}\`\`\``,
    },
  ];
  if (
    !isDefaultPort(serverValues.ServerPort) &&
    serverValues.ServerPort > 0 &&
    serverValues.ServerPort <= 65535
  ) {
    vars.push({
      name: "🟥 Puerto",
      value: `\`\`\`ini\n${serverValues.ServerPort}\`\`\``,
    });
  }
  if (serverStatus.version.name.length > 5) {
    vars.push({
      name: "🟥 Version",
      value: `\`\`\`ini\n${serverStatus.version.name}\`\`\``,
    });
  }
//   vars.push({
//     name: "🔻 Jugadores",
//     value: `\`\`\`ini\n${serverStatus.players.online} / ${
//       serverStatus.players.max
//     } (${Math.floor(
//       (serverStatus.players.online / serverStatus.players.max) * 100
//     )}%)\`\`\``,
//   });
  embed
    .setTitle(serverValues.ServerName)
    .setDescription(serverValues.ServerDescription)
    .setFields(vars)
    .setColor("Red");
  const components = [];
  if (!serverValues.ServerDiscord.startsWith("https://"))
    serverValues.ServerDiscord = "https://" + serverValues.ServerDiscord;
  // check if is a valid invitation link format
  var regex =
    /^(https:\/\/discord.gg\/|https:\/\/discord.com\/invite\/)([a-zA-Z0-9]+)$/;
  if (regex.test(serverValues.ServerDiscord)) {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Discord")
          .setStyle(ButtonStyle.Link)
          .setURL(serverValues.ServerDiscord)
      )
    );
  }
  return {
    embeds,
    isError: false,
    serverStatus,
    components,
    content: `${process.env.emojiMinecraftPlayer} ${serverStatus.players.online} / ${serverStatus.players.max}`,
  };
}
/**
 *
 * @param {{domain : String, port : Number}} server
 * @param {Boolean} isJava
 */
function isServerExists(server, isJava) {
  // ping server
  const status = isJava ? util.status : util.statusBedrock;
  if (server.port > 0 && server.port <= 65535)
    return status(server.domain, server.port)
      .then(() => true)
      .catch(() => false);
  else
    return status(server.domain) // why?
      .then(() => true)
      .catch(() => false);
}
module.exports = {
  getMinecraftInfoByServer,
  isServerExists,
  name: "updatedMinecraftServer",
  once: false,
  /**
   *
   * @param {Client} client
   * @param {MinecraftServer} server
   * @param {Guild} guild
   */
  async execute(server, guild, finishCallBack, client) {
    const channel = await guild.channels.fetch(server.ThreadID);
    if (!channel) return;
    const message = await channel.messages.fetch(server.MessageID);
    if (!message) {
      await MinecraftServer.deleteOne({ MessageID: server.MessageID });
      await channel.delete();
      console.error(
        "Message not found, deleting server... (" +
          server.ServerDomain +
          ":" +
          server.ServerPort +
          ")"
      );
      return;
    }
    const data = await getMinecraftInfoByServer(
      server,
      server.User,
      guild.client
    );
    delete data.isError;
    delete data.serverStatus;
    await message.edit(data);
    // Send a message to the same channel/thread, and delete after 1 second after the message is sent
    await channel.send("Actualizado correctamente").then((msg) => {
      setTimeout(() => {
        msg.delete();
      }, 1000);
    });
    console.log(
      "Updated server: " + server.ServerDomain + ":" + server.ServerPort
    );
    if (finishCallBack) finishCallBack();
  },
};
