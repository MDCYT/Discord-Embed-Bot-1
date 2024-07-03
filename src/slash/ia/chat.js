const { SlashCommandBuilder } = require("@discordjs/builders");
const Slash = require("../Slash.js");
const fs = require("fs");
const path = require("path");

const OpenAI = require('openai');

const { createNewChat, getChatsByID } = require('../../utils/databases/chatia.js');

const configuration = new OpenAI.Configuration({
  organization: process.env.OPENAI_ORG_ID,
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAI.OpenAIApi(configuration);

// Make a map for cooldowns
const cooldowns = new Map();

module.exports = class IASlash extends Slash {
  constructor(client) {
    super(client, {
      name: "ia",
      data: new SlashCommandBuilder().setName("ia").setDescription("Una IA que responde a tus preguntas").addStringOption(option => option.setName("pregunta").setDescription("Hazle una pregunta a la IA").setRequired(true))
    });
  }

  async run(interaction) {
    //Check if the user is on cooldown
    if (cooldowns.has(interaction.user.id) && Date.now() - cooldowns.get(interaction.user.id) < 1000 * 60 * parseInt(process.env.AI_COOLDOWN)) {
      return await interaction.editReply('Espera <t:' + Math.floor((cooldowns.get(interaction.user.id) + 1000 * 60 * parseInt(process.env.AI_COOLDOWN)) / 1000) + ':R> antes de hacer otra pregunta.');
    }

    //Set the user on cooldown
    cooldowns.set(interaction.user.id, Date.now());

    var prompt = interaction.options.getString("pregunta");

    try {
      const responseModeration = await openai.createModeration({
        engine: "text-moderation-latest",
        input: prompt
      });
      const respuestas = ["No puedo responder a eso.", "No deberias preguntar eso.", "No tengo respuesta para eso."];
      //Send the response if it is not safe
      if (responseModeration.data.results[0].categories.hate || responseModeration.data.results[0].categories['hate/threatening']) {
        return await interaction.editReply(respuestas[Math.floor(Math.random() * respuestas.length)]);
      }
      //Replace all mentions like <@!123456789> with the username
      prompt = prompt.replace(/<@!?[0-9]+>/g, (match) => {
        const id = match.replace(/<@!?/, '').replace(/>/, '');
        const user = interaction.client.users.cache.get(id);
        return user ? user.username : match;
      });
      //Replace all mentions like <@&123456789> with the role name
      prompt = prompt.replace(/<@&[0-9]+>/g, (match) => {
        const id = match.replace(/<@&/, '').replace(/>/, '');
        const role = interaction.guild.roles.cache.get(id);
        return role ? role.name : match;
      });
      //Replace all mentions like <#123456789> with the channel name
      prompt = prompt.replace(/<#[0-9]+>/g, (match) => {
        const id = match.replace(/<#/, '').replace(/>/, '');
        const channel = interaction.guild.channels.cache.get(id);
        return channel ? channel.name : match;
      });

      const inputSystem = fs.readFileSync(path.join(__basedir, 'src', 'utils', 'inputSystem.txt'), 'utf8').replace("%%AUTHOR%%", interaction.user.username).replace("%%CHANNEL_NAME%%", interaction.channel.name).replace("%%CHANNEL_TOPIC%%", interaction.channel.topic || "No hay topico definido")
      let lastMessages = (await getChatsByID(interaction.user.id + "-" + interaction.client.user.id, 20)).reverse();

      let AIPersonality = fs.readFileSync(path.join(__basedir, 'src', 'utils', 'AIPersonality.json'), 'utf8')
      AIPersonality = JSON.parse(AIPersonality);
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { "role": "system", "content": inputSystem },
          ...AIPersonality,
          ...lastMessages,
          { "role": "user", "content": prompt },
        ],
        user: interaction.user.username,
        temperature: 1.2,
        //If the user is boosting the server, we give them more tokens
        max_tokens: interaction.member.premiumSince ? 150 : 75,
      });
      await interaction.editReply(`<@${interaction.user.id}> dijo: ${prompt}`);
      await interaction.followUp(response.data.choices[0].message.content || 'No tengo idea de lo que estas hablando.');
      await createNewChat(interaction.user.id + "-" + interaction.user.id, "user", prompt);
      await createNewChat(interaction.user.id + "-" + interaction.user.id, "assistant", response.data.choices[0].message.content);

      return;
    } catch (error) {
      console.log(error);
      return await interaction.editReply('Ahorita mismo no puedo responder, intenta denuevo mas tarde.');
    }
  }
};
