module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
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
