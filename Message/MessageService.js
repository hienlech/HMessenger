const mongoose = require('mongoose');
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

    let result2 = await Message.aggregate([

        {
            "$match": {
                "roomId": roomId
            }
        },
        {

            "$lookup": {
                "from": "users",
                "localField": "sender",
                "foreignField": "username",
                "as": "Sender"
            }
        }
    ]);

    return result2
        .map(x => {
            return {
                content: x.content,
                type: x.type,
                roomId: x.roomId,
                sendTime: x.sendTime,
                sender: x.sender,
                senderDetail: {
                    fullname: x.Sender[0].fullname,
                    imageUrl: x.Sender[0].imageUrl
                }
            }
        });
}
exports.GetLastMessage = async (getterusername, username) => {
    let roomId = getterusername + username + getterusername;
    let roomId2 = username + getterusername + username;
    let allMessage = await exports.GetAllMessage(roomId);
    let allMessage2 = await exports.GetAllMessage(roomId2);
    allMessage2.forEach(x => allMessage.push(x));
    allMessage = allMessage.sort((x, y) => {
        return x.sendTime - y.sendTime
    });
    return allMessage.pop();
}