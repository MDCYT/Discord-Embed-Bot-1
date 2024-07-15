const { SlashCommandBuilder } = require("@discordjs/builders");
const Slash = require("../Slash.js");
const { EmbedBuilder, ChannelType, PermissionFlagsBits, ThreadAutoArchiveDuration, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { selectRow } = require('../../utils/databases/embeds.js');
const { insertMinecraftConfigRow } = require('../../utils/databases/minecraft.js');

module.exports = class EchoSlash extends Slash {
    constructor(client) {
        super(client, {
            name: "minecraf",
            data: new SlashCommandBuilder().setName("minecraft").setDescription("Setea el canal de servidores de minecraft").
                addSubcommand(subcommand =>
                    subcommand.setName("setup").setDescription("Setea el canal de servidores de minecraft")
                        .addChannelOption(option => option.setName("channel").setDescription("El canal a usar").setRequired(true))
                        .addChannelOption(option => option.setName("accept_channel").setDescription("El canal para aceptar.").setRequired(true))
                        .addStringOption(option => option.setName("embeds").setDescription("Los embeds a usar").setRequired(false))
                        .addStringOption(option => option.setName("message").setDescription("El mensaje a usar").setRequired(false))
                        .addStringOption(option => option.setName("java_message").setDescription("El mensaje a usar para el boton de Java").setRequired(false))
                        .addStringOption(option => option.setName("java_color").setDescription("El color a usar para el boton de Java").setRequired(false).setChoices(
                            {
                                name: "Rojo",
                                value: "Danger"
                            },
                            {
                                name: "Verde",
                                value: "Success"
                            },
                            {
                                name: "Azul",
                                value: "Primary"
                            },
                            {
                                name: "Gris",
                                value: "Secondary"
                            }
                        ))
                        .addStringOption(option => option.setName("java_emoji_id").setDescription("La ID del emoji a usar para el boton de Java").setRequired(false))
                        .addStringOption(option => option.setName("bedrock_message").setDescription("El mensaje a usar para el boton de Bedrock").setRequired(false))
                        .addStringOption(option => option.setName("bedrock_color").setDescription("El color a usar para el boton de Bedrock").setRequired(false).setChoices(
                            {
                                name: "Rojo",
                                value: "Danger"
                            },
                            {
                                name: "Verde",
                                value: "Success"
                            },
                            {
                                name: "Azul",
                                value: "Primary"
                            },
                            {
                                name: "Gris",
                                value: "Secondary"
                            }
                        ))
                        .addStringOption(option => option.setName("berock_emoji_id").setDescription("La ID del emoji a usar para el boton de Bedrock").setRequired(false))
                )
        });
    }

    async run(interaction) {
        const options = interaction.options;
        const type_message = options._subcommand;

        switch (type_message) {
            case "setup":
                let embeds_id = options.getString("embeds")?.split(",") || [];
                let message = options.getString("message"); 
                const channel = options.getChannel("channel");
                const accept_channel = options.getChannel("accept_channel");
                // Check if the channel is a forum channel
                if (channel.type !== ChannelType.GuildForum) return interaction.editReply({ content: "Debes seleccionar un canal de tipo foro (Forum)", ephemeral: true });

                // Check if the embeds_id are valid
                for (let embed_id of embeds_id) {
                    const embed = await selectRow(embed_id);
                    if (embed.length < 1) return interaction.editReply({ content: `El embed con el id ${embed_id} no existe`, ephemeral: true });
                }

                // Check if i have the permissions to send messages in the channel, create threads and send messages in the threads
                if (!interaction.guild.members.me.permissionsIn(channel).has(PermissionFlagsBits.SendMessages) || !interaction.guild.members.me.permissionsIn(channel).has(PermissionFlagsBits.CreatePublicThreads) || !interaction.guild.members.me.permissionsIn(channel).has(PermissionFlagsBits.SendMessagesInThreads) || !interaction.guild.members.me.permissionsIn(channel).has(PermissionFlagsBits.ManageThreads || !interaction.guild.members.me.permissionsIn(channel).has(PermissionFlagsBits.ManageChannels))) return interaction.reply({ content: "No tengo los permisos necesarios para realizar esta acción, entre los permisos necesarios que necesito en el canal están: Enviar mensajes, Crear hilos públicos, Enviar mensajes en hilos, Gestionar hilos y Gestionar canales", ephemeral: true });

                var embeds = [];

                for (let embed_id of embeds_id) {
                    const embed = await selectRow(embed_id);
                    embeds.push(new EmbedBuilder(embed[0].json));
                }

                //Add a default embed if the embeds are empty
                if (embeds.length < 1) {
                    embeds.push(new EmbedBuilder().setTitle("Minecraft Server").setDescription("Añade tu servidor de minecraft").setColor("#00ff00"));
                }

                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setLabel(options.getString("java_message") || "Java").setStyle(ButtonStyle[options.getString("java_color")] || ButtonStyle.Primary).setCustomId(`new-minecraft-java-${interaction.guildId}`).setEmoji(options.getString("java_emoji_id") || "🟦"),
                    new ButtonBuilder().setLabel(options.getString("bedrock_message") || "Bedrock").setStyle(ButtonStyle[options.getString("bedrock_color")] || ButtonStyle.Primary).setCustomId(`new-minecraft-bedrock-${interaction.guildId}`).setEmoji(options.getString("berock_emoji_id") || "🟥")
                );

                // Create a Post, and lock it
                const post = await channel.threads.create({
                    name: message || "Minecraft Server",
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                    reason: "Minecraft Server",
                    message: {
                        content: message || "Añade tu servidor de minecraft",
                        embeds,
                        components: [
                            actionRow
                        ]
                    }
                });

                // Pin the post
                await post.pin();

                // Block the channel, only the bot can send messages, the rest can only read
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    SendMessages: false,
                    AddReactions: false,
                    CreatePublicThreads: false,
                    CreatePrivateThreads: false,
                    ManageThreads: false,
                    ManageRoles: false,
                    ManageChannels: false,
                    SendMessagesInThreads: false
                });

                // Create and save the id for a tag
                await channel.setAvailableTags([
                    {
                        name: "Java",
                    },
                    {
                        name: "Bedrock",
                    }
                ])

                // Available tags is a array of objects, we need to get the id of the tag

                const javaTagID = channel.availableTags.find(tag => tag.name === "Java").id;
                const bedrockTagID = channel.availableTags.find(tag => tag.name === "Bedrock").id;

                // Save the configuration
                await insertMinecraftConfigRow(interaction.guildId, channel.id, post.id, post.lastMessageId, embeds_id, accept_channel.id, javaTagID, bedrockTagID);

                return interaction.editReply({ content: "Canal de servidores de minecraft configurado", ephemeral: true });
        }

    }
};
