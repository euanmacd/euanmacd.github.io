//game actor class
function Actor(context, animate_frames, animate_fps, level)
{
	this.level = level;
	
	this.pos_x = 0;
	this.pos_y = 0;
	
	this.levelGridIndex = [0, 0];
	
	this.shouldRotateWithDirection = false;
	this.rotation = 0;
	this.desiredRotation = 0;
	
	this.scale = 0.8;

	this.speed = 1;
	this.force = {x: 0, y: 0};

	this.context = context;

	//array of images animated over time
	this.frames = animate_frames;
	this.frame_interval = 0;
	if (animate_fps > 0)
		this.frame_interval = 1 / animate_fps;
	this.frame_index = 0;
	this.time_on_frame = 0;
	this.alpha = 1;
	
	this.controller = null;

	this.deathCallbacks = [];
	this.dead = false;

	this.health = 1;
	this.postHurtInvulnerabilityTime = 0;
	this.hurt = function(damage)
	{
		if(this.postHurtInvulnerabilityTime <= 0)
		{
			this.health -= damage;
			this.postHurtInvulnerabilityTime = 1;
		}
	}
}

//set actor movement speed
Actor.prototype.set_speed = function(v) {
	this.speed = v;
};

//set actor position
Actor.prototype.set_pos = function(x, y) {
	this.pos_x = x;
	this.pos_y = y;
};

//set actor pulse move
Actor.prototype.set_force = function(x, y) {
	this.force.x = x;
	this.force.y = y;
};

// force snap rotation, used when spawning some actors
Actor.prototype.snap_rotation = function(rotation)
{
	this.desiredRotation = this.rotation = rotation;
};

// set actor controller
Actor.prototype.set_controller = function(controller)
{
	this.controller = controller;
};

//actor update function called by main game loop
Actor.prototype.update = function(delta_time)
{
	// use controller for movement if we have one
	if (this.controller)
	{
		this.controller.update(delta_time);
	}
	else
	{
		//move actor
		var moveX = this.force.x * this.speed * delta_time;
		var moveY = this.force.y * this.speed * delta_time;
	
		this.set_pos(this.pos_x + moveX, this.pos_y + moveY);
		this.set_force(0, 0);
	
		//rotate
		if (this.shouldRotateWithDirection)
		{
			if (moveX || moveY)
			{
				this.desiredRotation = Math.atan2(moveY, moveX);
			}
		}
	}

	// keep desired rotation within 180 degrees of current rotation
	while (this.desiredRotation - this.rotation > Math.PI)
		this.desiredRotation -= Math.PI * 2;
	while (this.desiredRotation - this.rotation < -Math.PI)
		this.desiredRotation += Math.PI * 2;

	this.rotation = this.rotation + (this.desiredRotation - this.rotation) * Math.min(delta_time * 20, 1);

	// keep rotation within -180 to 180
	while (this.rotation > Math.PI)
		this.rotation -= Math.PI * 2;
	while (this.rotation < -Math.PI)
		this.rotation += Math.PI * 2;

	//animate actor
	this.time_on_frame += delta_time;
	if (this.frames.length > 0 && this.time_on_frame > this.frame_interval && this.frame_interval > 0)
	{
		this.frame_index = (this.frame_index + 1) % this.frames.length;
		this.time_on_frame = 0;
	}

	// update damage invulnerability
	if(this.postHurtInvulnerabilityTime > 0)
	{
		this.postHurtInvulnerabilityTime -= delta_time;
	}

	// if we somehow left the map, kill
	var levelSize = this.level.getLevelDimensions();
	var tileSize = this.level.getTileSize();
	if(this.pos_x < -tileSize[0] || this.pos_x > levelSize[0] || this.pos_y < -tileSize[1] || this.pos_y > levelSize[1])
	{
		this.kill();
	}
};

//draw actor
Actor.prototype.draw = function()
{
	this.context.globalAlpha = this.alpha;
	this.context.save();
	this.context.translate(this.pos_x + 32, this.pos_y + 32);
	this.context.rotate(this.rotation);
	this.context.scale(this.scale, this.scale);
	this.drawFrame();
	this.context.restore();
	this.context.globalAlpha = 1;
};

// set the active frame for drawing
Actor.prototype.set_frame = function(frame_index)
{
	if(frame_index >= 0 && frame_index < this.frames.length)
		this.frame_index = frame_index;
};

// draw current frame
Actor.prototype.drawFrame = function() {
	this.context.drawImage(this.frames[this.frame_index], -32, -32);
};

// add a function callback for death
Actor.prototype.add_death_callback = function(obj, call_function)
{
	this.deathCallbacks.push([obj, call_function]);
};

// called to kill actor
Actor.prototype.kill = function()
{
	this.dead = true;
	this.deathCallbacks.forEach(
		function(callback)
		{
			callback[1].apply(callback[0], [this]);
		},
		this);
};