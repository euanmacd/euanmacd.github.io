// base controller object, used to control an actor
function BaseController(actor)
{
    this.actor = actor;
}

// update
BaseController.prototype.update = function(delta_time)
{
    
};

// move our controlled actor towards a point, returns the unused travel distance
BaseController.prototype.moveActorTowardsPoint = function(point, max_distance)
{
    var distanceMoved = 0;
    var actor = this.actor;

    // no diagonal movement - either move x only or y only
    if (actor.pos_x != point[0])
    {
        var toPoint = point[0] - actor.pos_x;
        var direction = Math.sign(toPoint);
        distanceMoved = Math.min(max_distance, Math.abs(toPoint));
        actor.pos_x += distanceMoved * direction;
    }
    else if (actor.pos_y != point[1])
    {
        var toPoint = point[1] - actor.pos_y;
        var direction = Math.sign(toPoint);
        distanceMoved = Math.min(max_distance, Math.abs(toPoint));
        actor.pos_y += distanceMoved * direction;
    }

    return max_distance - distanceMoved;
}