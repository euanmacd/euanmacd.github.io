// base controller for AI
function PlayerController(actor)
{
    BaseController.call(this, actor);

    this.movementDirection = [0, 0];
    this.queuedMovement = [0, 0];
}

// parent is BaseController
PlayerController.prototype = Object.create(BaseController.prototype);

// process input
PlayerController.prototype.process_input = function(keys_down)
{
    var x = 0;
    var y = 0;

    if (37 in keys_down || 65 in keys_down) {
        //key left / A
        x -= 1;
    }
    if (38 in keys_down || 87 in keys_down) {
        //key up / W
        y -= 1;
    }
    if (39 in keys_down || 68 in keys_down) {
        //key right / D
        x += 1;
    }
    if (40 in keys_down || 83 in keys_down) {
        //key down / S
        y += 1;
    }

    // replace queued movement if there is input in 1 direction only
    if(x != 0 ^ y != 0)
        this.queuedMovement = [x, y];

    // spacebar - attack
    this.actor.attackQueued = 32 in keys_down;

    //set player character force
    //actor_whakman.set_force(x, y);
};

// update, handle the movement of the actor
PlayerController.prototype.update = function(delta_time)
{
    var movementRemaining = delta_time * 150;
    var actor = this.actor;
    var tileSize = actor.level.getTileSize();

    function canTraverseTileType(type)
    {
        return type != 0 && type != actor.level.tileType_ghostHome();
    }

    // loop until all movement is used
    while(movementRemaining > 0)
    {
        // if player wants to reverse, process that first
        if((this.queuedMovement[0] != 0 && this.movementDirection[0] == -this.queuedMovement[0]) ||
            (this.queuedMovement[1] != 0 && this.movementDirection[1] == -this.queuedMovement[1]))
        {
            actor.levelGridIndex[0] += this.queuedMovement[0];
            actor.levelGridIndex[1] += this.queuedMovement[1];
            this.movementDirection = this.queuedMovement;
            // consume direction change
            this.queuedMovement = [0, 0];
        }

        // move towards current grid node
        movementRemaining = this.moveActorTowardsPoint([actor.levelGridIndex[0] * tileSize[0], actor.levelGridIndex[1] * tileSize[1]], movementRemaining);

        // if all movement was consumed, break here
        if(movementRemaining < 0.00001)
            break;

        var changedDirection = false;

        // check pending direction change
        if (this.queuedMovement[0] != 0 || this.queuedMovement[1] != 0)
        {
            var desiredCell = [actor.levelGridIndex[0] + this.queuedMovement[0], actor.levelGridIndex[1] + this.queuedMovement[1]];
            var desiredDirectionCellType = actor.level.getCellType(desiredCell[0], desiredCell[1]);

            if (canTraverseTileType(desiredDirectionCellType))
            {
                // perform the direction change
                actor.levelGridIndex = desiredCell;
                this.movementDirection = this.queuedMovement;
                changedDirection = true;
                // consume direction change
                this.queuedMovement = [0, 0];
            }
        }

        // if we're not moving, nothing to do until new user input, so break out
        if(this.movementDirection[0] == 0 && this.movementDirection[1] == 0)
            break;

        // if we didn't change direction, carry on in current direction
        if(!changedDirection)
        {
            var desiredCell = [actor.levelGridIndex[0] + this.movementDirection[0], actor.levelGridIndex[1] + this.movementDirection[1]];
            var desiredDirectionCellType = actor.level.getCellType(desiredCell[0], desiredCell[1]);

            if (canTraverseTileType(desiredDirectionCellType))
            {
                actor.levelGridIndex = desiredCell;
            }
            else
            {
                // invalid movement (hit a wall), stop
                this.movementDirection = [0, 0];
                break;
            }
        }
    }

    //rotate
    if (this.movementDirection[0] != 0 || this.movementDirection[1] != 0)
    {
        this.actor.desiredRotation = Math.atan2(this.movementDirection[1], this.movementDirection[0]);
    }
};