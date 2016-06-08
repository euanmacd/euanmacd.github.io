//game actor class
function WhakmanActor(context, animate_frames, animate_fps, level) {
    Actor.call(this, context, animate_frames, animate_fps, level);

    this.isAttacking = false;
    this.attackQueued = false;
    this.attackDuration = 0.3;
    this.attackCooldown = 0.5;
    this.attackTimer = 0;
    
    this.eatDuration = 0.15;
    this.eatTimeRemaining = 0;
    this.justAte = function() { this.eatTimeRemaining = this.eatDuration; };
    
    this.health = 100;
    
    // a queue of projectiles which can be spawned for attacks
    this.projectilePrototypes = [];

    this.setAttackFrame = function(frame)
    {
        this.attackFrame = frame;
    };

    // Perform an attack
    this.attack = function()
    {
        this.attackTimer = this.attackDuration;
        this.isAttacking = true;
        this.attackQueued = false;

        // shooting direction
        var direction = [0, 0];
        // get from controller
        if(this.controller)
            direction = this.controller.movementDirection;

        function rotate(x, y, radians) {
            var cos = Math.cos(radians),
                sin = Math.sin(radians),
                nx = cos * x + sin * y,
                ny = cos * y - sin * x;
            return [nx, ny];
        }
        // if no direction found, use rotation
        if(direction[0] == 0 && direction[1] == 0)
            direction = rotate(1, 0, -this.rotation);

        // spawn first projectile in the queue
        var newProj = this.projectilePrototypes.shift();//[Math.floor(Math.random() * this.projectilePrototypes.length)].clone();
        newProj.set_pos(this.pos_x, this.pos_y);
        newProj.set_force(direction[0] * 100, direction[1] * 100);
        newProj.set_speed(4);
        newProj.snap_rotation(this.rotation);
        var callbackObj = this.projectile_spawn_callback[0];
        this.projectile_spawn_callback[1].apply(callbackObj, [newProj, true]);
    };
    
    // projectile info
    this.setProjectileSpawnCallback = function(obj, projectile_spawn_callback)
    {
        this.projectile_spawn_callback = [obj, projectile_spawn_callback];
    }
}

// parent is actor
WhakmanActor.prototype = Object.create(Actor.prototype);

// update override
WhakmanActor.prototype.update = function(delta_time)
{
    // update attack timing
    this.attackTimer -= delta_time;
    if(this.attackTimer <= 0)
    {
        if (this.isAttacking)
        {
            this.isAttacking = false;
            this.attackTimer = this.attackCooldown;
        }
        if(this.attackTimer <= 0 && this.attackQueued) // check attack timer again in case an attack just ended and cooldown is zero
        {
            // ammo check
            if(this.projectilePrototypes.length > 0)
            {
                // start attack
                this.attack();
            }
        }
    }
    
    // update open mouth time when eating
    if(this.eatTimeRemaining > 0)
    {
        this.eatTimeRemaining -= delta_time;
    }

    Actor.prototype.update.call(this, delta_time);
};

// draw current frame
WhakmanActor.prototype.drawFrame = function()
{
    // scale y by -1 to flip image vertically, so not upside-down when moving left
    if(this.rotation > Math.PI * 0.5 || this.rotation < -Math.PI * 0.5)
        this.context.scale(1, -1);

    // mouth is open if attacking or eating
    if(this.isAttacking || this.eatTimeRemaining > 0)
        this.context.drawImage(this.attackFrame, -32, -32);
    else
        Actor.prototype.drawFrame.call(this);
}