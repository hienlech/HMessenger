const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/playground')
    .then(() => {
        console.log("connected to mongoDB");
    }).catch((message) => {
        console.log(message);
    });
exports.mongoose = mongoose;
const userSchema = mongoose.Schema({
    username: String,
    password: String
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
        //console.log(result);
        console.log("Đăng nhập thành công");
        return result[0];

    }

    console.log("Đăng nhập thất bại");
    return false;


}





exports.CheckExistUsername = async function (username) {
    let result = await User.find({
        username: data.username
    });
    if (result.length > 0) {
        console.log(result);
        console.log("Tài khoản đã tồn tại");
        return false;


    }

    console.log("Chưa có trong DB");
    return true;
}
//Save(hien);