module.exports = (req, res, next) => {
    // console.log("Authenticating.....");
    // console.log("...................");
    // console.log("Authenticated");
    if (!req.session.user && req.url == '/home') {
        res.redirect('/');
        return;
    }
    next();

}