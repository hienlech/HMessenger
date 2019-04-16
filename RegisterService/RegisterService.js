const formidable = require('formidable');
const fs = require('fs');
const Path = require('path');
let cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: 'hienfpts',
    api_key: '114457149116259',
    api_secret: 'ZBEyWffhJZMKMNx5uyRk11LjIdc'
});

const User = require('../authentication/User');



exports.HandleRegister = async (req, res) => {


    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.uploadDir = 'public/upload/avatar';
    const fileExtentions = ['image/jpeg', 'image/png'];


    form.parse(req, async (err, fields, file) => {


        let user = new User.ApplicationUser({
            username: fields.username,
            password: fields.password,
            fullname: fields.fullname,
            isActive: false,
            imageUrl: ''
        });

        if (user.password != fields.reEnterPassword) {

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
        if (!file.imageFile.name) {
            User.SaveUser(user);
            console.log('đã lưu');
            res.sendFile(Path.resolve("./authentication/registerSuccess.html"));
            return;
        }
        if (err) {
            console.log(err);
            res.redirect('/register');
            return;
        }

        if (!fileExtentions.includes(file.imageFile.type)) {
            console.log(file.imageFile.type);
            console.log('Định dạng không đúng');
            res.redirect('/register');
            return;

        }

        cloudinary.uploader.upload(file.imageFile.path, {
            eager: {
                width: 250,
                height: 250,
                gravity: "faces",
                crop: "fill"
            }
        }, async (err, result) => {
            if (err) {
                console.log('Lỗi khi up lên cloudinary : ', err);
                res.redirect('/register');
                return;
            }
            console.log(result);
            user.imageUrl = result.eager[0].url;
            User.SaveUser(user);
            console.log('đã lưu');
            fs.unlink(file.imageFile.path, (err) => {
                if (err)
                    console.log(err);
                else
                    console.log('temp file has been deleted');
            });

            await res.sendFile(Path.resolve("./authentication/registerSuccess.html"));
        })

    });

}