const mongoose = require("mongoose");

const Embed = mongoose.model(
  "Menu",
  new mongoose.Schema(
    {
      ID: {
        type: String,
        required: true
      },
      events: {
        type: Array,
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
  async insertRow(ID, roles) {
    const date = new Date();
    const embed = new Embed({ID: ID , events: roles || [], date});
    return await embed.save();
  },
  async showAllRows() {
    const embed = await Embed.find({}).sort({ date: -1 });
    return embed;
  },
  async updateRow(ID, roles) {

    const embed = await Embed.findOneAndUpdate({ ID: ID }, { ID: ID , events: roles || []},{ new: true });
    return embed;
  },
  formatData(ID, roles) {
    const date = new Date();
    return {ID, roles, date};
  },

  async deleteRow(ID) {
    const embed = await Embed.find({ ID: ID});
    for (let bad  of embed) {
      console.log(`deleting ${bad.ID} - ${bad.date}`)
      await bad.deleteOne();  
    }

  },
  async selectRow(ID) {
    const embed = await Embed.find({ ID: ID  });
    return embed;
  },


};
