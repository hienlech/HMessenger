let rooms = [];
const sharedSession = require('express-socket.io-session');
const User = require('../authentication/User');

exports.init = (server, session) => {
    let io = require('socket.io')(server);

    io.use(sharedSession(session, {
        autoSave: true
    }));

    const globalRoom = "globalRoom";
    const MessageService = require('../Message/MessageService');

    io.on('connection', (socket) => {

        if (!socket.handshake.session.user)
            return;

        User.ActiveStatus(socket.handshake.session.user.username);

        socket.broadcast.emit('contactStatusChanged');

        socket.on('disconnect', async (reason) => {
            //  console.log(socket.handshake.session.user.username, " disconnected");
            await User.DeActiveStatus(socket.handshake.session.user.username);
            await socket.broadcast.emit('contactStatusChanged');
        })


        socket.on('getInfo', () => {
            if (socket.handshake.session.user) {
                console.log("get info : ", socket.handshake.session.user.username);
                let data = socket.handshake.session.user;
                socket.emit("YourInfo", {
                    username: data.username,
                    fullname: data.fullname,
                    imageUrl: data.imageUrl
                });
            };

        });

        socket.on('getAllGlobalMessage', async () => {

            socket.join(globalRoom);
            socket.emit('allOldMessage', await MessageService.GetAllMessageByRoomID(globalRoom));
        })



        socket.on('MessageToGlobal', mess => {

            let message = new MessageService.Message({
                type: "text",
                sender: socket.handshake.session.user.username,
                sendTime: Date.now(),
                roomId: globalRoom,
                content: mess
            });

            MessageService.SaveMessage(message);

            socket.broadcast.to(globalRoom).emit('IncomeMessage', {
                sender: socket.handshake.session.user.fullname,
                message: mess,
                senderImageUrl: socket.handshake.session.user.imageUrl
            });
        });


        //Đồng bộ hóa tin nhắn
        let syncMessage = async (receiver) => {

            //rời khỏi phòng chat đang tham gia
            socket.leaveAll();
            let roomId = socket.handshake.session.user.username + "#" + receiver + "#" + socket.handshake.session.user.username;
            let roomId2 = receiver + "#" + socket.handshake.session.user.username + "#" + receiver;

            //lấy tin nhắn thì sẽ join vào phòng chat
            let idCombine = socket.handshake.session.user.username + "#" + receiver;
            let currrentRoom;
            rooms.forEach(x => {
                if (x.includes(idCombine))
                    currrentRoom = x;
            })
            if (currrentRoom) {
                if (!socket.rooms[currrentRoom]) // nếu chưa join vào room 
                {
                    socket.join(currrentRoom);
                }
            } else //room chưa tồn tại
            {
                rooms.push(roomId); //tạo room
                socket.join(roomId);

            }


            //vì tin nhắn của 2 người có thể nằm ở 2 phòng khác nhau
            let allMessage = await MessageService.GetAllMessageByRoomID(roomId);
            let allMessage2 = await MessageService.GetAllMessageByRoomID(roomId2);

            //ghép tn 2 phòng vào 1
            allMessage2.forEach(x => allMessage.push(x));
            allMessage = allMessage.sort((x, y) => {
                return x.sendTime - y.sendTime
            });

            if (allMessage) {
                socket.emit('allOldMessage', allMessage); // tat ca tin nhan cua minh vaf nguoi minh gui
            }

        }
        socket.on('allMessageTo', syncMessage); // lấy toàn bộ tin nhắn cũ 


        socket.on('messageTo', async (message) => {

            // id phòng là tên 2 người 
            let roomId = socket.handshake.session.user.username + "#" + message.receiver + "#" +
                socket.handshake.session.user.username;

            // id này để check có nằm trong id trên
            let idCombine = socket.handshake.session.user.username + "#" + message.receiver;

            let messageToSend = new MessageService.Message({
                type: "text",
                sender: socket.handshake.session.user.username,
                sendTime: Date.now(),
                roomId: roomId,
                content: message.content
            });
            await MessageService.SaveMessage(messageToSend);
            await io.emit('contactStatusChanged');

            //kiểm tra xem room đã tồn tại chưa
            let currrentRoom;
            rooms.forEach(x => {
                if (x.includes(idCombine))
                    currrentRoom = x;
            })
            //nếu đã tồn tại room
            if (currrentRoom) {

                if (!socket.rooms[currrentRoom]) // nếu chưa join vào room 
                {
                    syncMessage(message.receiver);
                    socket.join(currrentRoom);
                }


                socket.broadcast.to(currrentRoom).emit('IncomeMessage', {
                    sender: socket.handshake.session.user.fullname,
                    message: messageToSend.content,
                    senderImageUrl: socket.handshake.session.user.imageUrl
                });
            } else //room chưa tồn tại
            {
                rooms.push(roomId); //tạo room
                socket.join(roomId);
                socket.broadcast.to(roomId).emit('IncomeMessage', messageToSend);
            }

        })

        socket.on('peopleStatus', async () => {
            //Lấy tên và trạng thái của tất cả mọi người 
            let allPeople = await User.GetAllPeopleStatus(socket.handshake.session.user.username);
            allPeople = allPeople.filter(x => x.username != socket.handshake.session.user.username);

            //Lấy tin nhắn cuối cùng của người gửi vàn người nhận
            for (const person of allPeople) {
                person.lastMessage = await MessageService.GetLastMessage(socket.handshake.session.user.username, person.username);
                if (person.lastMessage) {
                    if (person.lastMessage.sender == socket.handshake.session.user.username)
                        person.lastMessage = "Đi: " + person.lastMessage.content;
                    else
                        person.lastMessage = "Tới: " + person.lastMessage.content;
                }

            }

            socket.emit('AllPeople', allPeople);
        });



    });
}