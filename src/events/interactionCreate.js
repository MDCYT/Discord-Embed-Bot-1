const {EmbedBuilder} = require("discord.js")
module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    this.onCustomEv =async (id) => {
      const event = (await events.selectRow(id))[0].events  ;
        for (let ev of event) {
          switch(ev.type) {
          case "snd_msg": {
            var embeds = [];
            for (let embed of ev.embeds) {
              console.log(embed);
              const embedData = (await global.embeds.selectRow(embed))[0]
              if (embedData)
              embeds.push(new EmbedBuilder(embedData.json))
            }
            interaction.reply({
              ephemeral: true,
              content: ev.content,
              embeds
            })
            break;
          }
        case "add_role": {

          const id_rol = ev.id

          if ( interaction.member.roles.cache.some(role => role.id === ev.id))
            interaction.member.roles.remove(id_rol)
          else
            interaction.member.roles.add(id_rol)

          break;
          }
        }
        }

    }
    if (interaction.customId) {
      if (interaction.customId.startsWith("customevents_:")) {
        const id = interaction.customId.slice("customevents_:".length, interaction.customId.length)
        console.log(id);
        this.onCustomEv(id);
          return;
      }
    }
      if (interaction.values) {
      if (interaction.values[0].startsWith("customevents_:")) {
        const id = interaction.values[0].slice("customevents_:".length, interaction.values[0].length)
        console.log(id);
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
