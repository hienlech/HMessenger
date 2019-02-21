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





//Route 
app.get("/", function (req, res) {

    res.sendFile('./authentication/login.html', {
        root: __dirname
    })
});

app.get('/register', function (req, res) {
    res.sendFile('./authentication/register.html', {
        root: __dirname
    });
});
app.post('/register', async function (req, res) {

    let user = new User.ApplicatiionUser({
        username: req.body.username,
        password: req.body.password,
        fullname: req.body.fullname,
        isActive: false,
        imageUrl: ''
    });
    console.log(user);
    console.log(req.body.reEnterPassword)
    if (user.password != req.body.reEnterPassword) {

        res.redirect('/register');
        return;
    }
    if (await User.CheckExistUsername(user.username)) {
        res.redirect('/register');
        return;
    }
    if (!user.username || !user.password || !user.fullname) {
        res.redirect('/register');
        return;
    }



    await User.SaveUser(user);
    res.sendFile("./authentication/registerSuccess.html", {
        root: __dirname
    });

});




app.post("/login", async (req, res) => {
    let user = new User.ApplicationUser({
        username: req.body.username,
        password: req.body.password
    });



    let result = await User.Login(user);
    if (result) {
        req.session.user = result;
        res.redirect("/home");
    } else
        res.redirect("/");




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

    User.ActiveStatus(socket.handshake.session.user.username);
    socket.broadcast.emit('contactStatusChanged');

    socket.on('disconnect', async (reason) => {
        console.log(socket.handshake.session.user.username, " disconnected");
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

        let roomId = socket.handshake.session.user.username + "#" + receiver + "#" + socket.handshake.session.user.username;
        let roomId2 = receiver + "#" + socket.handshake.session.user.username + "#" + receiver;
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
                sender: messageToSend.sender,
                message: messageToSend.content
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