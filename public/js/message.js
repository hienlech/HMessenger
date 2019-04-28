//Socket.io connection



//all User info 
let UserInfo;
let contactList;
let MessToUsername;

//sử dụng trực tiếp websocket , không dùng ajax long pooling
let socket = io.connect("/", {
    transports: ['websocket']
});

socket.on('connect', function () {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    alert('Đã ngắt kết nối');
    location.reload();
})


//Tất cả tin nhắn cũ từ phòng chat
socket.on('allOldMessage', (allMessage) => {
    DisplayAllMessage(allMessage);
});





socket.on('contactStatusChanged', () => {
    socket.emit('peopleStatus');
})





socket.on('AllPeople', allContact => {
    contactList = allContact;
    DisplayAllContact(allContact);


});




socket.on('IncomeMessage', (message) => {
    playSound("newMessage");
    DisplayOthersNewMessage(message);
})


socket.on('YourInfo', (user) => {
    console.log(user);
    UserInfo = user;
    $('#myName').text(user.fullname);
    if (user.imageUrl)
        $('#profile-img').attr('src', user.imageUrl);
    else
        $('#profile-img').attr('src', GenerateAvatarFromName(user.fullname));
})

//lấy dữ liệu đầu kết nối
socket.emit('getInfo');
socket.emit('peopleStatus');
socket.emit('getAllGlobalMessage');


let globalAvatar = GenerateAvatarFromName('KTPM 2');
$('#roomImage').attr('src', globalAvatar);



function DisplayAllContact(allContact) {
    $('#contacts ul').empty();

    let avatar = GenerateAvatarFromName('KTPM 2');


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
        let avatar = GenerateAvatarFromName(person.fullname);
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


    let avatar = GenerateAvatarFromName(person.fullname);
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
                DisplayMyNewMessage(mess.message);
            } else
                DisplayOthersNewMessage(mess);
        }
    }
}

function newMessage() {
    message = $(".message-input input").val();
    if (!message)
        return;
    DisplayMyNewMessage(message);

    if (MessToUsername && MessToUsername != 'global') {
        socket.emit('messageTo', {
            receiver: MessToUsername,
            content: message
        })
    } else
        socket.emit('MessageToGlobal', message);


};


//Hiển thị tin nhắn của mình gửi
function DisplayMyNewMessage(message) {


    if ($.trim(message) == '') {
        return false;
    }
    let image = UserInfo.imageUrl ? UserInfo.imageUrl : GenerateAvatarFromName(UserInfo.fullname);
    $(`<li class="sent"><img src="${image}" alt="" /><p>` + message +
        '</p></li>').appendTo($('.messages ul'));
    $('.message-input input').val(null);
    $('.contact.active .preview').html('<span>You: </span>' + message);


    var l = document.getElementsByClassName("sent").length;
    document.getElementsByClassName("sent")[l - 1].scrollIntoView();



};
//hiển thị tin nhắn tới từ người khác
function DisplayOthersNewMessage(mess) {

    if ($.trim(mess.message) == '') {
        return false;
    }
    let image = mess.senderImageUrl ? mess.senderImageUrl : GenerateAvatarFromName(mess.sender);
    $('<li class="replies"><span>' + mess.sender +
        `</span><img src="${image}" alt="" /><p>` + mess.message +
        '</p></li>').appendTo($('.messages ul'));

    $('.contact.active .preview').html('<span>You: </span>' + mess.message);

    var l = document.getElementsByClassName("replies").length;
    //chuyển màn hình tới tin nhắn mới nhất
    document.getElementsByClassName("replies")[l - 1].scrollIntoView();
};