const mongoose = require('mongoose');
const MessageService = require('../Message/MessageService');
mongoose.connect('mongodb://localhost/playground', {
        useNewUrlParser: true
    })
    .then(() => {
        console.log("connected to mongoDB");
    }).catch((message) => {
        console.log(message);
    });
exports.mongoose = mongoose;

const userSchema = mongoose.Schema({
    username: String,
    password: String,
    fullname: String,
    imageUrl: String,
    isActive: Boolean
});


const User = mongoose.model('User', userSchema);

module.exports.ApplicatiionUser = User;

let hien = new User({
    username: "thanh",
    password: "thanh"
});
exports.SaveUser = async function Save(data) {

    let result = await data.save();
    // console.log(result);
}



exports.Login = async function Login(data) {
    let result = await User.find({
        username: data.username,
        password: data.password
    });
    if (result.length > 0) {
        console.log("Đăng nhập thành công");
        return result[0];

    }

    console.log("Đăng nhập thất bại");
    return false;


}





exports.CheckExistUsername = async function (username) {
    let result = await User.find({
        username: username
    });
    if (result.length > 0) {
        console.log(result);
        console.log("Tài khoản đã tồn tại");
        return true;


    }

    console.log("Chưa có trong DB");
    return false;
}


exports.GetAllPeopleStatus = async (getterusername) => {

    let result = await User.find();
    return result.map(x => {

        return {
            username: x.username,
            fullname: x.fullname,
            active: x.isActive,
            imageUrl: x.imageUrl,
            lastMessage: ""
        }
    });

}

exports.ActiveStatus = async (username) => {
    let result = await User.findOneAndUpdate({
        username: username
    }, {
        isActive: true
    }, {
        upsert: true
    }).exec();
    console.log(result);
}
exports.DeActiveStatus = async (username) => {
    let result = await User.findOneAndUpdate({
        username: username
    }, {
        isActive: false
    }, {
        upsert: true
    });
}