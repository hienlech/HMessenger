const express = require('express');
const app = express();
const authentication = require('./authentication/authentication');
const User = require('./authentication/User');
const bodyParser = require('body-parser');

let rooms = [];

//Connect Socket.io
let server = app.listen(3000, () => console.log("Application start on port 3000..."));
let io = require('socket.io')(server);


const session = require("express-session")({
    secret: "my-secret",
    resave: true,
    saveUninitialized: true
});
app.use(session);
const sharedSession = require('express-socket.io-session');

io.use(sharedSession(session, {
    autoSave: true
}));





app.use(express.static("public"));
app.use(authentication);
app.use(bodyParser.urlencoded({
    extended: true
}));





app.get("/", function (req, res) {

    res.sendFile('./authentication/login.html', {
        root: __dirname
    })
});

app.post("/login", async (req, res) => {
    let user = new User.ApplicatiionUser({
        username: req.body.username,
        password: req.body.password
    });



    let result = await User.Login(user);
    if (result) {
        req.session.user = result;
        res.redirect("/home");
    } else
        res.send("Đăng nhập thất bại");




});
app.get("/home", (req, res) => {
    res.sendFile('Message/index.html', {
        root: __dirname
    });


});

const globalRoom = "globalRoom";
const MessageService = require('./Message/MessageService');

io.on('connection', (socket) => {

    if (!socket.handshake.session.user)
        return;

    socket.on('getInfo', () => {
        if (socket.handshake.session.user) {
            console.log("get info : ", socket.handshake.session.user.username);
            let data = socket.handshake.session.user;
            socket.emit("YourInfo", {
                username: data.username,
                fullname: data.fullname
            });
        } else {
            console.log("anonymous");

        }
    });

    socket.on('getAllMessage', async () => {

        socket.emit('allMessage', await MessageService.GetAllMessage(globalRoom));
    })



    socket.on('PostMessage', mess => {

        let message = new MessageService.Message({
            type: "text",
            sender: socket.handshake.session.user.username,
            sendTime: Date.now(),
            roomId: globalRoom,
            content: mess
        });
        MessageService.SaveMessage(message);
        socket.broadcast.volatile.emit('IncomeMessage', {
            sender: socket.handshake.session.user.username,
            message: mess
        });
    });


    //Đồng bộ hóa tin nhắn
    let syncMessage = async (receiver) => {

        let roomId = socket.handshake.session.user.username + receiver + socket.handshake.session.user.username;
        let roomId2 = receiver + socket.handshake.session.user.username + receiver;
        let allMessage = await MessageService.GetAllMessage(roomId);
        let allMessage2 = await MessageService.GetAllMessage(roomId2);
        allMessage2.forEach(x => allMessage.push(x));
        allMessage = allMessage.sort((x, y) => {
            return x.sendTime - y.sendTime
        });
        if (allMessage) {
            socket.emit('allMessageToMessage', allMessage); // tat ca tin nhan cua minh vaf nguoi minh gui
        }

    }
    socket.on('allMessageTo', syncMessage);

    socket.on('messageTo', async (message) => {


        let roomId = socket.handshake.session.user.username + message.receiver +
            socket.handshake.session.user.username;
        let idCombine = socket.handshake.session.user.username + message.receiver;

        let messageToSend = new MessageService.Message({
            type: "text",
            sender: socket.handshake.session.user.username,
            sendTime: Date.now(),
            roomId: roomId,
            content: message.content
        });
        console.log(messageToSend);
        MessageService.SaveMessage(messageToSend);
        let currrentRoom;
        rooms.forEach(x => {
            if (x.includes(idCombine))
                currrentRoom = x;
        })
        console.log(currrentRoom);
        if (currrentRoom) {
            console.log(socket.rooms);
            if (!socket.rooms[currrentRoom])
                socket.join(currrentRoom);
            socket.broadcast.to(currrentRoom).emit('IncomeMessage', {
                sender: messageToSend.sender,
                message: messageToSend.content
            });
        } else {
            syncMessage(message.receiver);
            rooms.push(roomId);
            socket.join(roomId);
            socket.broadcast.to(roomId).emit('IncomeMessage', messageToSend);
        }

    })

    socket.on('peopleStatus', async () => {
        let allPeople = await User.GetAllPeopleStatus();
        allPeople = allPeople.filter(x => x.username != socket.handshake.session.user.username);
        socket.emit('AllPeople', allPeople);
    });



});