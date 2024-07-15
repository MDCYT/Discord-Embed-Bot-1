const { SlashCommandBuilder } = require("@discordjs/builders");
const Slash = require("../Slash.js");

const { MinecraftServer } = require("../../utils/databases/minecraft.js");
module.exports = class UpdateSlash extends Slash {
  constructor(client) {
    super(client, {
      name: "update",
      data: new SlashCommandBuilder()
        .setName("reenviar")
        .setDescription("Actualiza la información de un servidor de minecraft")
        .addStringOption((option) =>
          option
            .setName("ip")
            .setDescription("La ip del servidor, ejemplo: mc.hypixel.net")
            .setRequired(true)
        ),
    });
  }

  async run(interaction) {
    const options = interaction.options;
    const type_message = options._subcommand;

    switch (type_message) {
      case "server":
        const dominio = options.getString("ip");
        MinecraftServer.findOne({ ServerDomain: dominio }).then(
          async (server) => {
            if (!server)
              return interaction.editReply({ content: "Server not found" });
            interaction.client.emit(
              "updatedMinecraftServer",
              server,
              interaction.guild,
              () => {
                interaction.editReply({ content: "Server updated" });
              }
            );
          }
        );
        break;
    }
  }
};
