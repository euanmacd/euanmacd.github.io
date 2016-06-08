// base controller for AI
function AIController(actor, playerActor)
{
    BaseController.call(this, actor);

    this.playerActor = playerActor;

    this.currentWaypoints = [];
}

// parent is BaseController
AIController.prototype = Object.create(BaseController.prototype);

// update following waypoint path
AIController.prototype.update = function(delta_time)
{
    var actor = this.actor;
    var movementRemaining = delta_time * 150 * actor.speed;
    var tileSize = actor.level.getTileSize();

    // move towards current grid node
    movementRemaining = this.moveActorTowardsPoint([actor.levelGridIndex[0] * tileSize[0], actor.levelGridIndex[1] * tileSize[1]], movementRemaining);

    // if we have no path, return
    if(this.currentWaypoints.length == 0)
        return;
    
    // if any movement remains, then head to next grid node in path
    var shouldUpdateGridPos = movementRemaining > 0;
    var previousPos = [actor.pos_x, actor.pos_y];

    // use remaining movement to continue towards current waypoint
    while(movementRemaining > 0 && this.currentWaypoints.length > 0)
    {
        // head to our first waypoint
        var waypoint = this.currentWaypoints[0];
        movementRemaining = this.moveActorTowardsPoint(waypoint, movementRemaining);

        if(actor.pos_x == waypoint[0] && actor.pos_y == waypoint[1])
        {
            // waypoint reached, remove it
            this.currentWaypoints.shift();
        }
    }

    // update actor's grid index if we moved past current grid point
    if(shouldUpdateGridPos)
    {
        var moved = [actor.pos_x - previousPos[0], actor.pos_y - previousPos[1]];
        actor.levelGridIndex[0] += Math.ceil(Math.abs(moved[0]) / tileSize[0]) * Math.sign(moved[0]);
        actor.levelGridIndex[1] += Math.ceil(Math.abs(moved[1]) / tileSize[1]) * Math.sign(moved[1]);
    }

    // reached end of path
    if(this.currentWaypoints.length == 0)
    {
        this.on_target_reached();
    }
};

// called when reached the end of our path
AIController.prototype.on_target_reached = function()
{
    this.recalculate_path();
};

// recalculate the path to our current target
AIController.prototype.recalculate_path = function()
{
    // choose a random point in the level to move towards
    var point = this.actor.level.getRandomPoint();
    this.currentWaypoints = this.actor.level.findRoute(this.actor.levelGridIndex[0], this.actor.levelGridIndex[1], point[2], point[3]);
};