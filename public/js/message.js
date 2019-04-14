//Socket.io connection





function ImageFromName(name) {
    var colours = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f1c40f", "#e67e22", "#e74c3c", "#95a5a6", "#f39c12", "#d35400", "#c0392b", "#bdc3c7", "#7f8c8d"];


    var nameSplit = name.split(" "),
        initials = nameSplit[0].charAt(0).toUpperCase() + nameSplit[nameSplit.length - 1].charAt(0).toUpperCase();

    var charIndex = initials.charCodeAt(0) - 65,
        colourIndex = charIndex % 19;

    var canvas = document.getElementById("user-icon");
    var context = canvas.getContext("2d");

    var canvasWidth = 300 //$(canvas).attr("width"),
    canvasHeight = 300 //$(canvas).attr("height"),
    canvasCssWidth = canvasWidth,
        canvasCssHeight = canvasHeight;

    if (window.devicePixelRatio) {
        $(canvas).attr("width", canvasWidth * window.devicePixelRatio);
        $(canvas).attr("height", canvasHeight * window.devicePixelRatio);
        $(canvas).css("width", canvasCssWidth);
        $(canvas).css("height", canvasCssHeight);
        context.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    context.fillStyle = colours[colourIndex];
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = "128px Arial";
    context.textAlign = "center";
    context.fillStyle = "#FFF";
    context.fillText(initials, canvasCssWidth / 2, canvasCssHeight / 1.5);
    let imageURL = "" + canvas.toDataURL();
    context.clearRect(0, 0, canvas.width, canvas.height);
    return imageURL;
}



//all User info 
let UserInfo;
let contactList;
let MessToUsername;

//sử dụng trực tiếp http request để upgrade , không dùng ajax
let socket = io.connect("/", {
    transports: ['websocket'],
    //upgrade: false

});

socket.on('connect', function () {
    console.log('connected');

});
socket.on('disconnect', () => {
    alert('Đã ngắt kết nối');
    location.reload();
})


//tat ca tin nhan tu mot nguoi minh nhan den
socket.on('allMessageToMessage', (allMessage) => {

    DisplayAllMessage(allMessage);
});


socket.emit('getInfo');
socket.emit('peopleStatus');
socket.emit('getAllMessage');


socket.on('contactStatusChanged', () => {
    socket.emit('peopleStatus');
})





socket.on('AllPeople', allContact => {
    console.log(allContact);
    contactList = allContact;

    DisplayAllContact(allContact);


});


function DisplayAllMessage(data) {

    $('.messages ul').empty();
    if (data) {
        data = data.map(x => {
            return {
                senderUsername: x.sender,
                sender: x.senderDetail.fullname,
                message: x.content,
                senderImageUrl: x.senderDetail.imageUrl

            }
        });
        for (const mess of data) {
            if (mess.senderUsername == UserInfo.username) {
                newMyMessage(mess.message);
            } else
                newOtherMessage(mess);
        }
    }
}
socket.on('allMessage', (data) => {
    console.log(data);
    DisplayAllMessage(data);
});

socket.on('IncomeMessage', (message) => {
    newOtherMessage(message);
})


socket.on('YourInfo', (user) => {
    console.log(user);
    UserInfo = user;
    $('#myName').text(user.fullname);
    if (user.imageUrl)
        $('#profile-img').attr('src', user.imageUrl);
    else
        $('#profile-img').attr('src', ImageFromName(user.fullname));
})


//Hiển thị tin nhắn của mình gửi
function newMyMessage(message) {


    if ($.trim(message) == '') {
        return false;
    }
    let image = UserInfo.imageUrl ? UserInfo.imageUrl : ImageFromName(UserInfo.fullname);
    $(`<li class="sent"><img src="${image}" alt="" /><p>` + message +
        '</p></li>').appendTo($('.messages ul'));
    $('.message-input input').val(null);
    $('.contact.active .preview').html('<span>You: </span>' + message);


    var l = document.getElementsByClassName("sent").length;
    document.getElementsByClassName("sent")[l - 1].scrollIntoView();



};




let globalAvatar = ImageFromName('KTPM 2');
$('#roomImage').attr('src', globalAvatar);

function DisplayAllContact(allContact) {
    $('#contacts ul').empty();

    let avatar = ImageFromName('KTPM 2');


    $(
        `<li class="contact" data-username="global">
            <div class="wrap">
              <span class="contact-status online"></span>
              <img src="${avatar}" alt="" />
              <div class="meta">
                <p class="name">Global room</p>
                <p class="preview">Nhắn tin cho tất cả mọi người</p>
              </div>
            </div>
          </li>`
    ).appendTo('#contacts ul');

    for (const person of allContact) {
        let avatar = ImageFromName(person.fullname);
        person.imageUrl = person.imageUrl ? person.imageUrl : avatar;
        let regex = /[a-z0-9A-Z_ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀẾỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềếểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]+$/u

        let lastName = regex.exec(person.fullname)[0];
        person.lastName = lastName;
        DisplayContact(person, person.active);
    }
    $('#contacts ul li').click(function () {
        let username = $(this).data('username');
        let fullname = $(this).data('fullname');
        if (username == 'global') {
            location.reload();
            return;
        }
        $('#roomName').text(fullname);

        let imageRoom = $(this).find('div img').attr('src');
        $('#roomImage').attr('src', imageRoom);
        socket.emit('allMessageTo', username);
        MessToUsername = username;


    })
}
//Cap nhat trang thai cua nguoi khac
function DisplayContact(person, active) {


    let avatar = ImageFromName(person.fullname);
    let lastMessage = person.lastMessage ? `${person.lastMessage}` : `Nhắn tin cho ${person.lastName?person.lastName:person.fullname}`;
    let status = active ? 'online' : 'offline';
    $(
        `<li class="contact" data-username="${person.username}" data-fullname="${person.fullname}" >
            <div class="wrap">
              <span class="contact-status ${status}"></span>
              <img src="${person.imageUrl}" alt="" />
              <div class="meta">
                <p class="name">${person.fullname}</p>
                <p>${lastMessage}</p>
              </div>
            </div>
          </li>`
    ).appendTo($('#contacts ul'));

}



function ContactFilter() {
    let query = $(this).val();
    let currentContacctList = contactList.filter(name => {


        return name.fullname.toLowerCase()
            .includes(query.toLowerCase())


    })
    console.log(currentContacctList);
    DisplayAllContact(currentContacctList);
}
$('#searchContact').on('change', ContactFilter);
$('#searchContact').on('keydown', function (e) {
    if (e.which == 13) {
        let query = $(this).val();
        let currentContacctList = contactList.filter(name => {


            return name.fullname.toLowerCase()
                .includes(query.toLowerCase())


        })
        console.log(currentContacctList);
        DisplayAllContact(currentContacctList);
    }

});



$('.submit').click(function () {
    newMessage();
});
$(window).on('keydown', function (e) {
    if (e.which == 13) {
        newMessage();
        return false;
    }
});
//Gui tin nhan toi Global
function newMessage() {
    message = $(".message-input input").val();
    newMyMessage(message);

    if (MessToUsername && MessToUsername != 'global') {
        socket.emit('messageTo', {
            receiver: MessToUsername,
            content: message
        })
    } else
        socket.emit('PostMessage', message);


};




//# sourceURL=pen.js
//hiển thị tin nhắn tới từ người khác
function newOtherMessage(mess) {

    if ($.trim(mess.message) == '') {
        return false;
    }
    let image = mess.senderImageUrl ? mess.senderImageUrl : ImageFromName(mess.sender);
    $('<li class="replies"><span>' + mess.sender +
        `</span><img src="${image}" alt="" /><p>` + mess.message +
        '</p></li>').appendTo($('.messages ul'));

    $('.contact.active .preview').html('<span>You: </span>' + mess.message);

    var l = document.getElementsByClassName("replies").length;
    //chuyển màn hình tới tin nhắn mới nhất
    document.getElementsByClassName("replies")[l - 1].scrollIntoView();
};