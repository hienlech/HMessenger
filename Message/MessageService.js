const mongoose = require('../authentication/User').mongoose;

const messageSchema = mongoose.Schema({
    type: String,
    sender: String,
    sendTime: Date,
    roomId: String,
    content: String
});

const Message = mongoose.model('message', messageSchema);
exports.Message = Message;

exports.SaveMessage = async function (mess) {
    let result = mess.save();
}

exports.GetAllMessage = async function (roomId) {
    let result = await Message.find({
        roomId: roomId
    });

    return result;
}