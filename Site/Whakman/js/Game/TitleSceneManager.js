// title scene manager - shows controls and lets player start game
function TitleSceneManager(context, changeSceneCallback)
{
    SceneManager.call(this, context, changeSceneCallback);
}

// parent is scene manager
TitleSceneManager.prototype = Object.create(SceneManager.prototype);

// receive input from main loop
TitleSceneManager.prototype.process_input = function(keys_down)
{
    // spacebar - start game scene
    if(32 in keys_down)
    {
        this.changeScene(new GameSceneManager(this.context, this.changeSceneCallback));
    }
};

// draw
TitleSceneManager.prototype.draw = function()
{
    this.draw_hud();
};

//draw hud
TitleSceneManager.prototype.draw_hud = function()
{
    var context = this.context;
    var canvasSize = [context.canvas.width, context.canvas.height];

    context.fillStyle = "white";
    context.textAlign = "center";

    var textPos = [canvasSize[0] * 0.5, 40];

    // Title
    context.font = "20px 'LondonBetween'";
    context.fillText("Euan Macdougall's", textPos[0] - 100, textPos[1]);

    context.font = "bold 50px 'LondonBetween'";
    textPos[1] += 60;
    context.fillText("Whakman", textPos[0], textPos[1]);

    // Rules
    context.font = "30px 'LondonBetween'";
    textPos[1] += 60;
    context.fillText("- Rules -", textPos[0], textPos[1]);

    context.font = "25px 'LondonBetween'";
    textPos[1] += 40;
    context.fillText("Collect all the gold coins to win!", textPos[0], textPos[1]);
    textPos[1] += 40;
    context.fillText("Touching a ghost will hurt you, unless you shoot it first", textPos[0], textPos[1]);
    textPos[1] += 40;
    context.fillText("Collect junk for ammunition", textPos[0], textPos[1]);
    textPos[1] += 40;
    context.fillText("Look out, green ghosts are hunting you!", textPos[0], textPos[1]);

    // Controls
    context.font = "30px 'LondonBetween'";
    textPos[1] += 60;
    context.fillText("- Controls -", textPos[0], textPos[1]);

    context.font = "25px 'LondonBetween'";
    textPos[1] += 40;
    context.fillText("WASD or arrow keys to change direction", textPos[0], textPos[1]);
    textPos[1] += 40;
    context.fillText("Spacebar to shoot", textPos[0], textPos[1]);

    context.font = "bold 40px 'LondonBetween'";
    textPos[1] += 80;
    context.fillText("PRESS SPACEBAR TO BEGIN", textPos[0], textPos[1]);
};





























