// pickups enum
var PickupTypes = {
    coin:0,
    ammo:1
};

// pickup class for coins and ammo
function Pickup(context, animate_frames, animate_fps, level, pickup_type, pickup_data) {
    Actor.call(this, context, animate_frames, animate_fps, level);

    this.scale = 0.6;
    
    this.pickup_type = pickup_type;
    // data is projectile protoype for ammo
    this.pickup_data = pickup_data;
}

// parent is actor
Pickup.prototype = Object.create(Actor.prototype);

// on pikcup
Pickup.prototype.onPickup = function(picker_actor)
{
    switch(this.pickup_type)
    {
        case PickupTypes.coin:
            // do nothing, handled by scene
            break;
        case PickupTypes.ammo:
            picker_actor.projectilePrototypes.push(this.pickup_data);
            break;
    }
    
    this.kill();
};