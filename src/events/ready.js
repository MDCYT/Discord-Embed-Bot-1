const {
  REST
} = require("@discordjs/rest");
const {
  Routes
} = require("discord-api-types/v9");
const {
  insertRow,
  selectRow,
  updateRow
} = require("../utils/databases/roles");
const cron = require("node-cron");

const { Client, ActivityType } = require("discord.js");
module.exports = {
  name: "ready",
  once: true,
  /**
   * 
   * @param {Client} client 
   * @param {Collection} slashes 
   */
  async execute(client, slashes) {
    const activities = [{
        name: `>help`,
        type: ActivityType.Listening
      
      },
      {
        name: "for you",
        type: ActivityType.Listening

      },
    ];
    ["can_send_embeds", "set_buttons", "can_edit_or_create"].forEach(async ID=>{
      client.logger.info("Initing rol " + ID);
      const dbdata = await selectRow(ID);
        if (dbdata.length < 1)
        {
          client.logger.info(`Cant get rol ${ID} initing as default`);
          insertRow(ID, []); // Iniciar con la lista vacia
        } else {
          const data = dbdata[0];
          updateRow(ID, data.roles || [])
          client.logger.info(`Founded ${ID} setting as: ${(data.roles || []).length > 1 ? data.roles.join(",") : "default"}`)
        }
    })

    // Update presence
    client.user.setActivity({
		name: "en BoolyOficial",
        type: ActivityType.Streaming,
      	url: "https://www.twitch.tv/boolyoficial"
    })

  /*  if(client.statsChannels.guilds_channel) { // SHHHH
    setInterval(
      () => {
        //Update name of a channel
        const guilds_channel = client.channels.cache.get(
          client.statsChannels.guilds_channel
        );
        let guilds = client.guilds.cache.size;
        //Create a variable with the number closest to guilds that is a power of 100
        let closest_guilds = Math.pow(10, Math.floor(Math.log10(guilds))) * 10;
        guilds_channel.setName(
          `『🏁』 Guilds: ${abbreviateNumber(client.guilds.cache.size)}/${closest_guilds}`
        );
      }, //Every 10 minutes
      600000
    );
  }*/

  //  client.logger.info(`Logged in as ${client.user.tag}!`);
    client.logger.info(`Discord: que bot sos`) // \nYo: ${client.user.tag}
    client.logger.info(` YO: ${client.user.tag}`) // \nYo: ${client.user.tag}

    client.logger.info(
      `Ready to serve ${client.users.cache.size} users in ${client.guilds.cache.size} servers.`
    );

    const CLIENT_ID = client.user.id;

    const rest = new REST({
      version: "10",
    }).setToken(process.env.TOKEN);

    await (async () => {
      try {
        if (process.env.ENV === "production") {
          await rest.put(Routes.applicationCommands(CLIENT_ID), {
            body: slashes,
          });
          client.logger.info("Global slash commands updated!");
        } else {
          await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, process.env.GUILD_ID), {
              body: slashes,
            }
          );
          client.logger.info("Guild slash commands updated!");
        }
      } catch (e) {
        if (e) client.logger.error(e);
        client.logger.error("Failed to update slash commands!");
      }
    })();
    // cron every 6 hours
    cron.schedule("0 */6 * * *", async () => {
      const Minecraft = require("../utils/databases/minecraft")
      const allservers = await Minecraft.showAllMinecraftServerRows();
      for (let server of allservers) {
        const guild = client.guilds.cache.get(server.guild_id);
        setTimeout(() => {
        client.emit("updatedMinecraftServer", server, guild, ()=>{
          console.log("Finished")
        })
      }, 3000 * allServers.indexOf(server));
    }
    });

    client.logger.info("Updating database and scheduling jobs...");

    for await (const guild of client.guilds.cache.values()) {

      // if((guild.id === "374071874222686211") || (guild.id === "992960423081037925")) continue;

      // console.log(guild.name)
      // console.log(guild.id)

      /*
       ** -----------------------------------------------------------------------
       *  FIND SETTINGS
       ** -----------------------------------------------------------------------
       */

      // Find mod log
      const modLog = guild.channels.cache.find(
        (c) =>
        c.name.replace("-", "").replace("s", "") === "modlog" ||
        c.name.replace("-", "").replace("s", "") === "moderatorlog"
      );

      // Find admin and mod roles
      const adminRole = guild.roles.cache.find(
        (r) =>
        r.name.toLowerCase() === "admin" ||
        r.name.toLowerCase() === "administrator"
      );
      const modRole = guild.roles.cache.find(
        (r) =>
        r.name.toLowerCase() === "mod" || r.name.toLowerCase() === "moderator"
      );
      const muteRole = guild.roles.cache.find(
        (r) => r.name.toLowerCase() === "muted"
      );
      const crownRole = guild.roles.cache.find((r) => r.name === "The Crown");

      /** ------------------------------------------------------------------------------------------------
       * UPDATE TABLES
       * ------------------------------------------------------------------------------------------------ */
      // Update settings table
      await client.mongodb.settings.insertRow(
        guild.id,
        guild.name,
        guild.systemChannelID, // Default channel
        guild.systemChannelID, // Welcome channel
        guild.systemChannelID, // Farewell channel
        null, // Crown Channel
        null, //XP Channel
        modLog ? modLog.id : null,
        adminRole ? adminRole.id : null,
        modRole ? modRole.id : null,
        muteRole ? muteRole.id : null,
        crownRole ? crownRole.id : null
      );

      // If member joined
      const missingMember = await client.mongodb.users.selectMissingMembers(
        guild.id
      );

      for (const user of missingMember) {
        if (guild.members.cache.has(user.user_id)) {
          client.mongodb.users.updateCurrentMember(1, user.user_id, guild.id);
        }
      }

      /** ------------------------------------------------------------------------------------------------
       * VERIFICATION
       * ------------------------------------------------------------------------------------------------ */
      // Fetch verification message
      const {
        verificationChannelID: verificationChannelId,
        verificationMessageID: verificationMessageId,
      } = await client.mongodb.settings.selectRow(guild.id);
      const verificationChannel = guild.channels.cache.get(
        verificationChannelId
      );
      if (verificationChannel && verificationChannel.viewable) {
        try {
          await verificationChannel.messages.fetch(verificationMessageId);
        } catch (e) {
          client.logger.error(e);
        }
      }

      /** ------------------------------------------------------------------------------------------------
       * CROWN ROLE
       * ------------------------------------------------------------------------------------------------ */
      // Schedule crown role rotation
      await client.utils.scheduleCrown(client, guild);
    }

    // Remove left guilds
    if (!client.shard) {
      const dbGuilds = await client.mongodb.settings.selectGuilds();
      const guilds = Array.from(client.guilds.cache.keys());

      //Create a const leftGuilds if the guilds in the dbGuilds array are not in the guilds array

      const leftGuilds = dbGuilds.filter((g1) => !guilds.includes(g1.guildID));

      for (const guild of leftGuilds) {
        await client.mongodb.settings.deleteGuild(guild.guildID);

        client.logger.info(`Any Bot has left ${guild.guild_name}`);
      }
    }

    // Finish message
    client.logger.info(
      `Ready to serve ${client.guilds.cache.size} guilds, in ${
        client.channels.cache.size
      } channels of ${client.guilds.cache.reduce(
        (acc, guild) => acc + guild.memberCount,
        0
      )} users.`
    );
  },
};
