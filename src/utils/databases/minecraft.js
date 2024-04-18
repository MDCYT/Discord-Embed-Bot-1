const mongoose = require("mongoose");

const MinecraftConfig = mongoose.model(
    "mcConfigs",
    new mongoose.Schema(
        {
            GuildID: {
                type: String,
                required: true
            },
            ChannelID: {
                type: String,
                required: true
            },
            AcceptChannelID: {
                type: String,
                required: true
            },
            ThreadID: {
                type: String,
                required: true
            },
            MessageID: {
                type: String,
                required: true
            },
            EmbedsID: {
                type: Array,
                required: true
            },
        }
    )
);

const MinecraftServer = mongoose.model(
    "mcServer2",
    new mongoose.Schema(
        {
            Accepted: {
                type: Boolean,
                required: false,
            },
            GuildID: {
                type: String,
                required: true
            }, 
            User: {
                type: {
                    id: String,
                    name: String,
                    avatar: String
                },
                required: true
            },
            MessageID: {
                type: String,
                required: true
            },
            Java: {
                type: Boolean,
                required: true
            },
            ThreadID: {
                type: String,
                required: true,
            },
            ServerDomain: {
                type: String,
                required: true
            },
            ServerPort: {
                type: Number,
                required: true
            },
            ServerName: {
                type: String,
                required: true
            },
            ServerDescription: {
                type: String,
                required: true
            },
            ServerDiscord: {
                type: String,
                required: true
            },
        }
    )
);

module.exports = {
    MinecraftConfig,
    MinecraftServer,
    async editMinecraftServer(GuildID, data) {
        const embed = await MinecraftServer.findOneAndUpdate({ GuildID: GuildID }, data, { new: true });
        return embed;
    },
    async hasMinecraftServer(GuildID, ServerDomain, ServerPort) {
        const embed = await MinecraftServer.findOne({ GuildID: GuildID, ServerDomain: ServerDomain, ServerPort: ServerPort });
        return embed._id !== undefined ? true : false;
    },

    async createMinecraftServer(GuildID, data) {
        data.GuildID = GuildID;
        // check if has one already
        const _embed =await MinecraftServer.exists({ ServerDomain: data.ServerDomain, ServerPort: data.ServerPort })
       console.log(_embed)
        if (_embed) {
            return "no";
        }
        const embed = new MinecraftServer(data);
        return await embed.save();
    },
    async insertMinecraftConfigRow(GuildID, ChannelID, MessageID, ThreadID, EmbedsID = [], AcceptChannelID) {
        if (await MinecraftConfig.exists({ GuildID: GuildID })) {
            return MinecraftConfig.findOneAndUpdate({ GuildID: GuildID }, {
                GuildID: GuildID,
                ChannelID: ChannelID,
                MessageID: MessageID,
                ThreadID: ThreadID,
                EmbedsID: EmbedsID,
                AcceptChannelID: AcceptChannelID
            }, { new: true });

        }
        const embed = new MinecraftConfig({ GuildID: GuildID, ChannelID: ChannelID, MessageID: MessageID, ThreadID: ThreadID, EmbedsID: EmbedsID , AcceptChannelID: AcceptChannelID});
        return await embed.save();
    },
    async updateMinecraftConfigRow(GuildID, {
        ChannelID,
        MessageID,
        ThreadID,
        EmbedsID = []
    }) {
        // If the message ID, the Channel ID or the EmbedsID are not provided, it will not update them
        // Check if embedsID is an array and if have at least one element, if not, it will not update it
        if (EmbedsID.length < 1) {
            const embed = await MinecraftConfig.findOneAndUpdate({ GuildID: GuildID }, {
                GuildID: GuildID,
                ChannelID: ChannelID,
                ThreadID: ThreadID,
                MessageID: MessageID
            }, { new: true });
            return embed;
        } else {
            const embed = await MinecraftConfig.findOneAndUpdate({ GuildID: GuildID }, {
                GuildID: GuildID,
                ChannelID: ChannelID,
                MessageID: MessageID,
                ThreadID: ThreadID,
                EmbedsID: EmbedsID
            }, { new: true });
            return embed;
        }
    },

    async deleteMinecraftConfigRow(guildID) {
        const embed = await MinecraftConfig.find({ GuildID: guildID });
        for (let bad of embed) {
            console.log(`deleting ${bad.GuildID}`)
            await bad.deleteOne();
        }
    },
    async getMinecraftChannelId(guildId) {
        console.log(guildId)
        const embed = (await MinecraftConfig.findOne({ GuildId: guildId }));
        return embed?.ChannelID || "";
    },

    async selectMinecraftConfigRow(guildID) {
        const embed = await MinecraftConfig.find({ GuildID: guildID });
        if (!embed) return;
        delete embed._id;
        return embed;
    },

    async insertMinecraftServerRow(GuildID, ServerDomain, ServerPort, ServerName, ServerDescription, ServerDiscord) {
        const embed = new MinecraftServer({ GuildID: GuildID, ServerDomain: ServerDomain, ServerPort: ServerPort, ServerName: ServerName, ServerDescription: ServerDescription, ServerDiscord: ServerDiscord });
        return await embed.save();
    },

    async updatedMinecraftServerRow(GuildID, {
        ServerDomain,
        ServerPort,
        ServerName,
        ServerDescription,
        ServerDiscord
    }) {
        const embed = await MinecraftServer.findOneAndUpdate({ GuildID: GuildID }, {
            GuildID: GuildID,
            ServerDomain: ServerDomain,
            ServerPort: ServerPort,
            ServerName: ServerName,
            ServerDescription: ServerDescription,
            ServerDiscord: ServerDiscord
        }, { new: true });
        return embed;
    },

    async deleteMinecraftServerRow(guildID, ServerDomain, ServerPort) {
        const embed = await MinecraftServer.find({ GuildID: guildID, ServerDomain: ServerDomain, ServerPort: ServerPort});
        for (let bad of embed) {
            console.log(`deleting ${bad.GuildID}`)
            await bad.deleteOne();
        }
    },

    async selectMinecraftServerRow(GuildID, ServerDomain, ServerPort) {
        const embed = await MinecraftServer.findOne({ GuildID, ServerDomain, ServerPort});
        return embed;
    },

    async showAllMinecraftServerRows() {
        const embed = await MinecraftServer.find({}).sort({ GuildID: 1 });
        return embed;
    },

    async showAllMinecraftConfigRows() {
        const embed = await MinecraftConfig.find({}).sort({ GuildID: 1 });
        return embed;
    },
};
