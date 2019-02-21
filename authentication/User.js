const mongoose = require('mongoose');
const MessageService = require('../Message/MessageService');

let ActiveList = ['global'];

exports.ActiveStatus = (username) => {

    if (ActiveList.includes(username))
        return;
    ActiveList.push(username);
    // let result = await User.findOneAndUpdate({
    //     username: username
    // }, {
    //     isActive: true
    // }, {
    //     upsert: true
    // }).exec();
    // console.log(result);
    console.log(ActiveList);
}
exports.DeActiveStatus = (username) => {
    let findUsername = ActiveList.indexOf(username);
    if (findUsername >= 0)
        ActiveList.splice(findUsername, 1);
    // let result = await User.findOneAndUpdate({
    //     username: username
    // }, {
    //     isActive: false
    // }, {
    //     upsert: true
    // });
}


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

module.exports.ApplicationUser = User;

let hien = new User({
    username: "thanh",
    password: "thanh"
});
exports.SaveUser = async function Save(data) {

    let result = await data.save();
    // console.log(result);
}



exports.Login = async function Login(data) {
    let result = await exports.ApplicationUser.find({
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
            active: ActiveList.includes(x.username),
            imageUrl: x.imageUrl,
            lastMessage: ""
        }
    });

}