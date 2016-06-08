//main game 
var Whakman = function(w, h) {

    var whakman = {};

    var width = w;
    var height = h;

    var canvas = null;
    var context = null;


    //input
    var keys_down = {};

    var currentScene = null;
    var game_time = Date.now() * 0.001;

    //init game
    whakman.init = function() {
        whakman.create_canvas(width, height);

        //input events
        addEventListener("keydown", function (e) { keys_down[e.keyCode] = true; }, false);
        addEventListener("keyup", function (e) { delete keys_down[e.keyCode]; }, false);
    };

    //create canvas
    whakman.create_canvas = function()
    {
        canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        document.body.appendChild(canvas);

        context = canvas.getContext("2d");
        context.font = "bold 30px 'LondonBetween'";
        context.fillStyle = "DarkOrange";
    };

    //clear canvas
    whakman.clear = function() {
        context.fillStyle = 'rgb(100,100,100)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        //context.clearRect(0, 0, canvas.width, canvas.height);
    };

    //game loop
    whakman.start = function() {
        requestAnimationFrame(this.update);
    };

    // change to a new scene
    whakman.changeScene = function(newScene) {
        // reset input
        keys_down = [];

        currentScene = newScene;
        if(!newScene.isLoaded())
            newScene.startLoading(width, height);
    };

    //update loop
    whakman.update = function()
    {
        if(currentScene == null)
        {
            // start with title scene
            whakman.changeScene(new TitleSceneManager(context, whakman.changeScene));
        }
        if (!currentScene.isLoaded()) {
            requestAnimationFrame(whakman.update);
            return;
        }

        whakman.clear();

        var previousGameTime = game_time;
        game_time = Date.now() * 0.001;
        var delta_time = game_time - previousGameTime;

        // update the current scene
        currentScene.process_input(keys_down);
        currentScene.update(delta_time);
        // draw the current scene
        currentScene.draw();

        requestAnimationFrame(whakman.update);
    };

    return whakman;
};

// main game loop
var main = function() {
    var game = Whakman(704, 610);
    game.init();
    game.start();
};

var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

//run game!
main();

// Math.sign() implementation for IE
if (!Math.sign) {
    Math.sign = function sign(value) {
        if(value > 0) return 1;
        if(value < 0) return -1;
        return 0;
    };
}