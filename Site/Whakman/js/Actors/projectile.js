//player's projectiles class
function Projectile(context, animate_frames, animate_fps, level, shouldSpin) {
    Actor.call(this, context, animate_frames, animate_fps, level);

    this.shouldSpin = shouldSpin;
    this.shouldRotateWithDirection = !shouldSpin;
    
    this.spinSpeed = Math.PI * 4;
    this.scale = 0.7;

}

// parent is actor
Projectile.prototype = Object.create(Actor.prototype);

// update override
Projectile.prototype.update = function(delta_time)
{
    var forceBkup = { x:this.force.x, y:this.force.y };
    
    if(this.shouldSpin)
    {
        this.desiredRotation += delta_time * this.spinSpeed;
    }

    Actor.prototype.update.call(this, delta_time);

    // re-apply the movement force
    this.force.x = forceBkup.x;
    this.force.y = forceBkup.y;

    var level = this.level;
    function canTraverseTileType(type)
    {
        return type != 0 && type != level.tileType_ghostHome();
    }

    // check location, kill if we're overlapping a wall
    var tileSize = level.getTileSize();
    if(!canTraverseTileType(level.getTypeAtWorldPoint(
            this.pos_x + tileSize[0] * 0.5 * (Math.abs(this.force.x) < 0.000001 ? 0 : Math.sign(this.force.x)),
            this.pos_y + tileSize[1] * 0.5 * (Math.abs(this.force.y) < 0.000001 ? 0 : Math.sign(this.force.y)))))
    {
        this.kill();
    }
};

// clone object
Projectile.prototype.clone = function()
{
    var newProj = new Projectile(this.context, this.frames, this.frame_interval, this.shouldSpin, this.level);
    return newProj;
};