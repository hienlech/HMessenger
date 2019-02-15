const express = require('express');
const app = express();
const authentication = require('./authentication/authentication');
const User = require('./authentication/User');
const bodyParser = require('body-parser');


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
    })

});