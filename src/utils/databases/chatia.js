const mongoose = require("mongoose");

const Chat = mongoose.model("chatia", new mongoose.Schema({
  id: String,
  role: String,
  content: String,
  date: { type: Date, default: Date.now }
}));

module.exports = {
  async createNewChat(id, role, content) {
    const newChat = new Chat({ id, role, content });
    await newChat.save();
    return newChat;
  },

  async getChatsByID(id, quantity = 30) {
    //Get last 30 messages
    let chats = await Chat.find({ id }).sort({ date: -1 }).limit(quantity);
    //Remove the _id, date, __v and id fields
    chats = chats.map(chat => {
      chat = chat.toObject();
      delete chat._id;
      delete chat.date;
      delete chat.__v;
      delete chat.id;
      return chat;
    });
    return chats;
  }
}