const Conversation = require('../models/Conversation');
const ClothingItem = require('../models/ClothingItem');
const geminiService = require('../services/geminiService');

// POST /api/chat
const sendMessage = async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, owner: req.user._id });
      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found.' });
      }
    } else {
      conversation = await Conversation.create({
        owner: req.user._id,
        title: message.slice(0, 50),
        messages: [],
      });
    }

    const wardrobeItems = await ClothingItem.find({ owner: req.user._id });

    const result = await geminiService.chat({
      message,
      history: conversation.messages,
      wardrobeItems,
      profile: req.user,
    });

    conversation.messages.push({ role: 'user', content: message });
    conversation.messages.push({ role: 'assistant', content: result.reply });
    await conversation.save();

    res.json({
      success: true,
      data: { conversationId: conversation._id, reply: result.reply, mode: result.mode },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/conversations
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ owner: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, data: { conversations, count: conversations.length } });
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/conversations/:id
const getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, owner: req.user._id });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    res.json({ success: true, data: { conversation } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/chat/conversations/:id
const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, owner: req.user._id });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    await conversation.deleteOne();
    res.json({ success: true, message: 'Conversation deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getConversations, getConversation, deleteConversation };
