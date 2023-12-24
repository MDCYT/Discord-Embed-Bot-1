const mongoose = require("mongoose");

const Embed = mongoose.model(
  "Embed",
  new mongoose.Schema(
    {
      ID: {
        type: String,
        required: true
      
      },
      json: {
        type: Object,
        required: true
      },
      date: {
        type: Date,
        required: true,
      }
    },
    {
      timestamps: true,
    }
  )
);

module.exports = {
  async insertRow(ID, json) {
    const date = new Date();
    const embed = new Embed({ID, json, date});
    return await embed.save();
  },
  async showAllEmbeds() {
    const embed = await Embed.find({}).sort({ date: -1 });
    return embed;
  },
  async updateRow(ID, json) {
    const embed = await Embed.findOneAndUpdate({ ID }, { ID, json},{ new: true });
    return embed;
  },
  async editEmbed(ID, json) {
    Embed.findByIdAndDelete({ID});
    const date = new Date();
    const embed = new Embed({ID, json, date});
    return await embed.save();
  },
  async selectRow(ID) {
    const embed = await Embed.find({ ID });
    return embed;
  },
  async createEmbed(ID, json) {
    const date = new Date();
    const embed = new Embed({ID, json, date});
    return await embed.save();
  },

};
