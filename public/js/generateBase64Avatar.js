    function GenerateAvatarFromName(name) {
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