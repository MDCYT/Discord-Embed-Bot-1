const { isServerExists } = require("./updatedMinecraftServer");
const MinecraftConfig = require("../utils/databases/minecraft");
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
                avatar: member.user.avatarURL()
            },
            Java: !bedrock,
            ServerDomain: fields.get("ip").value,
            ServerPort:  Number(fields.get("port").value || 0),
            ServerName: fields.get("name").value,
            ServerDescription: fields.get("description").value,
            ServerDiscord: fields.get("discord_invite")?.value || "https://google.com",
            MessageID: "123",
            ThreadID: "123",
        }
        if (!data.ServerDiscord || data.ServerDiscord.length < 1 ) // if is "", 
            data.ServerDiscord = "https://google.com";
       await interaction.deferReply({ephemeral: true});
        const hasStatus = await isServerExists({
            domain: data.ServerDomain,
            port: data.ServerPort
        }, !bedrock);
        if (!hasStatus) 
            return interaction.editReply({content: "El servidor dio error al hacerle ping."});
        const save =await MinecraftConfig.createMinecraftServer(guild.id, data)
        if (save === 'no')
            return interaction.editReply({ ephemeral: true, content: "Ya existe este servidor." });
            
            
        const post = await channel.threads.create({
            name: data.ServerName  + ` [${data.ServerDomain}]`,
            autoArchiveDuration: 1440,
            message: {
              content: "loading...",
            }
            
          });
        data.ThreadID = post.id;
        // get first message
        const messages = await post.messages.fetch();
        const message = messages.first();
        data.MessageID = message.id;
        
          client.emit("updatedMinecraftServer", data, guild, async ()=>{
        await MinecraftConfig.editMinecraftServer(guild.id, data);
            interaction.editReply({content: "Su servidor fue agregado a la lista en <#" + post.id + ">."});
          });
    }
}