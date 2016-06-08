// controller for the ghost enemies
// features a finite state machine for hunting, retreating and randomly moving
function GhostController(actor, playerActor)
{
    AIController.call(this, actor, playerActor);

    // this ghost's current state
    this.currentState = null;

    // ghost state speeds
    this.huntSpeed = 1.2;
    this.wanderSpeed = 0.8;
    this.retreatSpeed = 0.5;

    this.changeState = function(newState)
    {
        if(this.currentState)
            this.currentState.OnLeaveState();

        this.currentState = newState;
        newState.OnEnterState();
    };

    // return boolean for if we're the hunter ghost
    this.isHunting = function()
    {
        return this.currentState && this.currentState instanceof GhostState_HuntPlayer;
    };
    
    // make this ghost a hunter
    this.setHunter = function()
    {
        this.changeState(new GhostState_HuntPlayer(this));
    };

    this.actor.add_death_callback(this, GhostController.prototype.on_killed);
}

// parent is AIController
GhostController.prototype = Object.create(AIController.prototype);

// update
GhostController.prototype.update = function(delta_time)
{
    AIController.prototype.update.call(this, delta_time);

    if(this.currentState == null)
    {
        this.changeState(new GhostState_RandomMove(this));
    }

    this.currentState.update(delta_time);
};

// called when reached the end of out path
GhostController.prototype.on_target_reached = function()
{
    // forward to state
    if(this.currentState)
        this.currentState.onTargetReached();
};

// recalculate the path to our current target
GhostController.prototype.recalculate_path = function()
{
    // forward to state
    if(this.currentState)
        this.currentState.recalculate_path();
};

// when ghost is killed, retreat
GhostController.prototype.on_killed = function()
{
    if(!(this.currentState instanceof GhostState_Retreat))
        this.changeState(new GhostState_Retreat(this));
};

//-- Base ghost state --
function GhostState(controller){ this.controller = controller; }

GhostState.prototype.OnEnterState = function(){};

GhostState.prototype.OnLeaveState = function(){};

GhostState.prototype.update = function(delta_time){};

GhostState.prototype.onTargetReached = function(){};

GhostState.prototype.recalculate_path = function(){};

//-- Random move ghost state --
function GhostState_RandomMove(controller)
{
    GhostState.call(this, controller);
}
GhostState_RandomMove.prototype = Object.create(GhostState.prototype);

GhostState_RandomMove.prototype.OnEnterState = function()
{
    // speed
    this.controller.actor.speed = this.controller.wanderSpeed;

    // start moving
    this.recalculate_path();
};

GhostState_RandomMove.prototype.onTargetReached = function()
{
    // head to another random point
    this.recalculate_path();
};

GhostState_RandomMove.prototype.recalculate_path = function()
{
    var controller = this.controller;
    var actor = controller.actor;
    // choose a random point in the level to move towards
    var point = actor.level.getRandomPoint();
    controller.currentWaypoints = actor.level.findRoute(actor.levelGridIndex[0], actor.levelGridIndex[1], point[2], point[3]);
};

//-- Hunt player state --
function GhostState_HuntPlayer(controller)
{
    GhostState.call(this, controller);
    
    this.timeUntilRecalcPath = 0;
}
GhostState_HuntPlayer.prototype = Object.create(GhostState.prototype);

GhostState_HuntPlayer.prototype.OnEnterState = function()
{
    // change skin to green
    this.controller.actor.set_frame(1);

    // speed
    this.controller.actor.speed = this.controller.huntSpeed;
    
    // begin the hunt
    this.recalculate_path();
};

GhostState_HuntPlayer.prototype.OnLeaveState = function()
{
    // reset skin to blue
    this.controller.actor.set_frame(0);    
};

GhostState_HuntPlayer.prototype.update = function(delta_time)
{
    // since player is moving, recalculate the path often
    this.timeUntilRecalcPath -= delta_time;
    if(this.timeUntilRecalcPath <= 0)
    {
        this.recalculate_path();
    }
};

GhostState_HuntPlayer.prototype.onTargetReached = function()
{
    // we should have hit the player, but recalculate in case not
    this.recalculate_path();
};

GhostState_HuntPlayer.prototype.recalculate_path = function()
{
    var controller = this.controller;
    var actor = controller.actor;
    // head for the player
    var point = controller.playerActor.levelGridIndex;
    controller.currentWaypoints = actor.level.findRoute(actor.levelGridIndex[0], actor.levelGridIndex[1], point[0], point[1]);
    
    this.timeUntilRecalcPath = 0.1;
};

//-- Retreating ghost state --
function GhostState_Retreat(controller)
{
    GhostState.call(this, controller);

    this.timeUntilHealed = 0;
}
GhostState_Retreat.prototype = Object.create(GhostState.prototype);

GhostState_Retreat.prototype.OnEnterState = function()
{
    // get path home
    this.recalculate_path();

    // set speed and transparency
    this.controller.actor.speed = this.controller.retreatSpeed;
    this.controller.actor.alpha = 0.5;
};

GhostState_Retreat.prototype.OnLeaveState = function()
{
    // ghost no longer dead
    this.controller.actor.dead = false;

    // reset alpha
    this.controller.actor.alpha = 1;
};

GhostState_Retreat.prototype.update = function(delta_time)
{
    // if we're waiting for heal, tick timer
    if(this.timeUntilHealed > 0)
    {
        this.timeUntilHealed -= delta_time;
        if (this.timeUntilHealed <= 0)
        {
            // back to random movement
            this.controller.changeState(new GhostState_RandomMove(this.controller));
        }
    }
};

GhostState_Retreat.prototype.onTargetReached = function()
{
    // we're home! 3 second rest period
    this.timeUntilHealed = 3;
};

GhostState_Retreat.prototype.recalculate_path = function()
{
    var controller = this.controller;
    var actor = controller.actor;
    // path to the ghost home
    var point = actor.level.getGhostHome();
    controller.currentWaypoints = actor.level.findRoute(actor.levelGridIndex[0], actor.levelGridIndex[1], point[0], point[1]);
};