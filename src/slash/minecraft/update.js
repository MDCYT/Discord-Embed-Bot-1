const { SlashCommandBuilder } = require("@discordjs/builders");
const Slash = require("../Slash.js");
const { EmbedBuilder, ChannelType, PermissionFlagsBits, ThreadAutoArchiveDuration, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const {MinecraftServer} = require("../../utils/databases/minecraft.js");
module.exports = class UpdateSlash extends Slash {
    constructor(client) {
        super(client, {
            name: "update",
            data: new SlashCommandBuilder().setName("update").setDescription("Actualiza la información de un servidor de minecraft").
                addSubcommand(subcommand =>
                    subcommand.setName("server").setDescription("Actualiza la información de un servidor de minecraft")
                    .addStringOption(
                        option =>
                        option.setName("thread")
                        .setDescription("ID hilo a actualizar (server)")
                        .setRequired( true)
                    )
                        
                )
                
        });
    }

    async run(interaction) {
        const options = interaction.options;
        const type_message = options._subcommand;

        switch (type_message) {
            case "server":
                const thread = options.getString("thread");
                MinecraftServer.findOne({ThreadID: thread}).then(async server => {
                    if (!server) 
                        return interaction.editReply({content: "Server not found"});
                    interaction.client.emit("updatedMinecraftServer", server, interaction.guild, ()=>{
                        interaction.editReply({content: "Server updated"});
                    
                    });
                })
                break;
        }
    }
}