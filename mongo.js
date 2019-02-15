const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/playground')
    .then(() => {
        console.log("connected to mongoDB");
    }).catch((message) => {
        console.log(message);
    });

const javaSchema = new mongoose.Schema({
    Id: Number,
    Label: String,
    timeset: String
});
async function saveJava(java) {

    const result = await java.save();
    console.log(result);
};
const Java = mongoose.model('Java', {
    Id: Number,
    Label: String,
    timeset: String
}, 'Java');

const java1 = new Java({
    Id: 699,
    Label: "Java.Hiển.4",
    timeset: "NO"
});
//saveJava(java1);
async function SearchJava() {
    let result = await Java.find().sort({
        Id: 1
    });
    result.forEach(x => console.log(x['Id']));

};
SearchJava();