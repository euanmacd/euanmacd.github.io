// result scene - shown when the player wins/loses
function ResultSceneManager(context, changeSceneCallback, was_victory, score)
{
    SceneManager.call(this, context, changeSceneCallback);

    this.was_victory = was_victory;
    this.score = score;

    this.timeUntilEnableInput = 3;
}

// parent is scene manager
ResultSceneManager.prototype = Object.create(SceneManager.prototype);

// update
ResultSceneManager.prototype.update = function(delta_time)
{
    // delay until allowing input
    if(this.timeUntilEnableInput > 0)
    {
        this.timeUntilEnableInput -= delta_time;
    }
}

// receive input from main loop
ResultSceneManager.prototype.process_input = function(keys_down)
{
    // wait a few seconds before enabling input
    if(this.timeUntilEnableInput > 0)
        return;

    // spacebar - restart game scene
    if(32 in keys_down)
    {
        this.changeScene(new GameSceneManager(this.context, this.changeSceneCallback));
    }
};

// draw
ResultSceneManager.prototype.draw = function()
{
    this.draw_hud();
};

//draw hud
ResultSceneManager.prototype.draw_hud = function()
{
    var context = this.context;
    var canvasSize = [context.canvas.width, context.canvas.height];

    context.textAlign = "center";

    context.fillStyle = (this.was_victory ? "rgb(50,255,50)" : "red");
    context.font = "bold 30px 'LondonBetween'";
    var textPos = [canvasSize[0] * 0.5, canvasSize[1] * 0.4];
    context.fillText("- You " + (this.was_victory ? "win!" : "lose") + " -", textPos[0], textPos[1]);

    context.fillStyle = "white";
    textPos[1] += 60;
    context.fillText("Final score: " + this.score, textPos[0], textPos[1]);

    // show if input enabled
    if(this.timeUntilEnableInput <= 0)
    {
        context.font = "bold 40px 'LondonBetween'";
        textPos[1] += 80;
        context.fillText("PRESS SPACEBAR TO PLAY AGAIN", textPos[0], textPos[1]);
    }
};





























