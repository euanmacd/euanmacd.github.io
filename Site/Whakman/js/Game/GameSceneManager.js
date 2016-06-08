// game scene manager - this controls the flow of a game: level, spawning, win/lose
function GameSceneManager(context, changeSceneCallback)
{
    SceneManager.call(this, context, changeSceneCallback);

    this.level = null;

    // countdown timer before starting
    this.countdownToStart = 3;
    // time to display "GO" after countdown
    this.coundownDisplayGoTime = 0.5;

    // ammo for player to start with
    this.startingAmmo = 1;

    // player score
    this.score = 0;

    // the number of hunter ghosts at any time
    this.huntersToSpawn = 1;

    // assets
    this.image_whakman_close = null;
    this.image_whakman_open = null;
    this.image_whakman_icon = null;
    this.image_ghost_green = null;
    this.image_ghost_blue = null;

    this.image_bomb = null;
    this.image_fish = null;
    this.image_rock = null;
    this.image_rocket = null;
    this.image_rollerskates = null;
    this.image_skull = null;
    this.image_spring = null;
    this.image_glove = null;

    this.image_coin = null;

    //actors
    this.actor_whakman = null;
    this.actor_list = [];
    this.projectile_list = [];
    this.pickups_list = [];

    // get the list an actor resides in
    this.get_list = function(actor)
    {
        var list = this.actor_list;
        if(actor instanceof Projectile)
            list = this.projectile_list;
        else if(actor instanceof Pickup)
            list = this.pickups_list;
        return list;
    };

    // delete an actor on death
    this.on_actor_died = function(actor)
    {
        var list = this.get_list(actor);
        var index = list.indexOf(actor);
        if(index != -1)
        {
            list.splice(index, 1);
        }
        delete actor;
    };

    // actor spawn
    this.spawn_actor = function(actor, addDeathCallback)
    {
        if(typeof addDeathCallback != "undefined" && addDeathCallback == true)
            actor.add_death_callback(this, this.on_actor_died);

        var list = this.get_list(actor);
        list.push(actor);
    };
}

// parent is scene manager
GameSceneManager.prototype = Object.create(SceneManager.prototype);

// perform any asset/data loading
GameSceneManager.prototype.startLoading = function(width, height)
{
    this.level = Level(64, 64);

    // super call
    SceneManager.prototype.startLoading.call(this, width, height);

    this.level.generate(this.level.getGameSceneGrid());
    this.create_actors();
};

// start preloading images
GameSceneManager.prototype.preloadImages = function(loader)
{
    this.image_whakman_close = loader.addImage("images/whakman_01.png");
    this.image_whakman_open = loader.addImage("images/whakman_02.png");
    this.image_whakman_icon = loader.addImage("images/osd_whakman.png");
    this.image_ghost_green = loader.addImage("images/ghost_01.png");
    this.image_ghost_blue = loader.addImage("images/ghost_02.png");

    this.image_bomb = loader.addImage("images/bomb.png");
    this.image_fish = loader.addImage("images/fish.png");
    this.image_rock = loader.addImage("images/rock.png");
    this.image_rocket = loader.addImage("images/rocket.png");
    this.image_rollerskates = loader.addImage("images/rollerskates.png");
    this.image_skull = loader.addImage("images/skull.png");
    this.image_spring = loader.addImage("images/spring.png");
    this.image_glove = loader.addImage("images/glove.png");

    this.image_coin = loader.addImage("images/coin.png");

    this.level.preload_images(loader);
};

// receive input from main loop
SceneManager.prototype.process_input = function(keys_down)
{
    if(this.countdownToStart > 0)
        return;

    // forward input to player controller
    this.actor_whakman.controller.process_input(keys_down);
};

// update 
GameSceneManager.prototype.update = function(delta_time)
{
    // update the coundotn timer
    if(this.countdownToStart > -this.coundownDisplayGoTime)
    {
        this.countdownToStart -= delta_time;
        // don't update the scene if countdown isn't done
        if(this.countdownToStart > 0)
            return;
    }

    //actors
    var allActors = this.actor_list.concat(this.projectile_list, this.pickups_list);
    for(var i = 0; i < allActors.length; i++)
    {
        var actor = allActors[i];
        actor.update(delta_time);
    }

    // collision test actors/projectiles
    this.collision_check(this.actor_list, this.projectile_list);
    // collision test player/actors
    this.collision_check([this.actor_whakman], this.actor_list);
    // collision test player/pickups
    this.collision_check([this.actor_whakman], this.pickups_list);
    
    // check for dead player
    if(this.actor_whakman.health <= 0)
    {
        this.changeScene(new ResultSceneManager(this.context, this.changeSceneCallback, false, this.score));
    }

    // set hunter ghosts
    if(this.huntersToSpawn > 0)
    {
        var ghostList = [];
        for(var i = 0; i < this.actor_list.length; i++)
        {
            // make list of alive non-hunter ghosts
            if(this.actor_list[i].controller instanceof GhostController && !this.actor_list[i].dead && !this.actor_list[i].controller.isHunting())
                ghostList.push(this.actor_list[i]);
        }
        while (this.huntersToSpawn > 0)
        {
            if(ghostList.length == 0)
                break;

            // choose a random valid ghost and make it a hunter
            var hunterIndex = Math.floor(Math.random() * ghostList.length);
            ghostList[hunterIndex].controller.setHunter();
            this.huntersToSpawn--;

            ghostList.splice(hunterIndex, 1);
        }
    }
};

// check if the player has won
GameSceneManager.prototype.winConditionCheck = function()
{
    // are all coins collected?
    for(var i = 0; i < this.pickups_list.length; i++)
    {
        // found a coin in the world, no win yet
        if(this.pickups_list[i].pickup_type == PickupTypes.coin)
            return;
    }

    // if no coind found, player has won
    // add remaining health to score
    this.score += this.actor_whakman.health;
    // change to result scene
    this.changeScene(new ResultSceneManager(this.context, this.changeSceneCallback, true, this.score));
};

// check for collisions between 2 arrays of actors
GameSceneManager.prototype.collision_check = function(listA, listB)
{
    function Box(x, y, extentX, extentY) {
        this.left = x - extentX;
        this.right = x + extentX;
        this.top = y - extentY;
        this.bottom = y + extentY;
    };
    var tileWidth = this.level.getTileSize();
    var collisionExtent = [tileWidth[0] * 0.25, tileWidth[1] * 0.25];

    // check for collisions between projectiles and actors
    for(var a = 0; a < listA.length; a++)
    {
        var actorA = listA[a];
        var aBox = new Box(actorA.pos_x, actorA.pos_y, collisionExtent[0], collisionExtent[1]);

        for(var b = 0; b < listB.length; b++)
        {
            var actorB = listB[b];

            if(actorA == actorB)
                continue;

            var bBox = new Box(actorB.pos_x, actorB.pos_y, collisionExtent[0], collisionExtent[1]);

            // axis aligned box collision test
            if(aBox.left > bBox.right)
                continue;
            if(aBox.right < bBox.left)
                continue;
            if(aBox.bottom < bBox.top)
                continue;
            if(aBox.top > bBox.bottom)
                continue;

            // a collision!
            this.process_collision(actorA, actorB);
        }
    }
};

// process a collision between 2 actors of unknown types
GameSceneManager.prototype.process_collision = function(actorA, actorB, isSecondAttempt)
{
    var processed = false;

    // projectile test
    if(actorA instanceof Projectile)
    {
        // check for ghost kill
        if(actorB.controller instanceof GhostController && !actorB.dead)
        {
            // if we killed the hunter, queue a new one
            if(actorB.controller.isHunting())
            {
                this.huntersToSpawn++;
            }

            // don't kill the projectile, let it go through/hit multiple ghosts
            //actorA.kill();

            actorB.kill();

            this.score += 1;

            processed = true;
        }
    }
    
    // player actor test
    if(actorA.controller instanceof PlayerController)
    {
        // check for ghost touch
        if(actorB.controller instanceof GhostController && !actorB.dead)
        {
            // hurt the player
            actorA.hurt(10);
        }
        
        // pickups
        if(actorB instanceof Pickup)
        {
            actorB.onPickup(actorA);

            if(actorB.pickup_type == PickupTypes.coin)
            {
                this.score += 5;
                this.winConditionCheck();
            }

            actorA.justAte();
        }
    }

    // if not processed, try again with actos switched
    if(!processed && (typeof isSecondAttempt == "undefined" || isSecondAttempt == false))
        this.process_collision(actorB, actorA, true);
};

// draw
GameSceneManager.prototype.draw = function()
{
    //draw level
    this.level.draw(this.context);

    //actors
    var allActors = this.pickups_list.concat(this.actor_list, this.projectile_list);
    for(var i = 0; i < allActors.length; i++)
    {
        var actor = allActors[i];
        actor.draw();
    }

    // draw top layer of level
    this.level.drawLate(this.context);

    //draw hud
    this.draw_hud();
};

//create actors
GameSceneManager.prototype.create_actors = function()
{
    var level = this.level;
    var tileSize = level.getTileSize();

    // projectiles that can be spawned
    var projectile_prototypes = [];
    projectile_prototypes.push(new Projectile(this.context, [this.image_bomb], 0, level, true));
    projectile_prototypes.push(new Projectile(this.context, [this.image_fish], 0, level, true));
    projectile_prototypes.push(new Projectile(this.context, [this.image_glove], 0, level, false));
    projectile_prototypes.push(new Projectile(this.context, [this.image_rock], 0, level, true));
    projectile_prototypes.push(new Projectile(this.context, [this.image_rocket], 0, level, false));
    projectile_prototypes.push(new Projectile(this.context, [this.image_rollerskates], 0, level, true));
    projectile_prototypes.push(new Projectile(this.context, [this.image_skull], 0, level, true));
    projectile_prototypes.push(new Projectile(this.context, [this.image_spring], 0, level, true));

    // create player actor
    {
        var player_spawn = level.getPlayerSpawn();
        var whakman = new WhakmanActor(this.context, [this.image_whakman_close/*, image_whakman_open*/], 0, level);
        this.actor_whakman = whakman;
        whakman.setAttackFrame(this.image_whakman_open);
        var pos = level.getRandomPoint();
        whakman.levelGridIndex = player_spawn;
        whakman.set_pos(player_spawn[0] * tileSize[0], player_spawn[1] * tileSize[1]);
        whakman.set_speed(2);
        whakman.set_controller(new PlayerController(whakman));
        whakman.shouldRotateWithDirection = true;
        whakman.setProjectileSpawnCallback(this, this.spawn_actor);
        this.actor_list.push(whakman);
        // start with random ammo
        for(var i = 0; i < this.startingAmmo; i++)
            whakman.projectilePrototypes.push(projectile_prototypes[Math.floor(Math.random() * projectile_prototypes.length)]);
    }

    // spawn ghosts
    var ghost_spawns = level.getGhostSpawns();
    for(var i = 0; i < ghost_spawns.length; i++)
    {
        var actor_ghost = new Actor(this.context, [this.image_ghost_blue, this.image_ghost_green], 0, level);
        actor_ghost.levelGridIndex = ghost_spawns[i];
        actor_ghost.set_pos(ghost_spawns[i][0] * tileSize[0], ghost_spawns[i][1] * tileSize[1]);
        actor_ghost.set_controller(new GhostController(actor_ghost, this.actor_whakman));
        this.spawn_actor(actor_ghost, false);
    }

    // spawn coins
    var coin_spawns = level.getCoinSpawns();
    for(var i = 0; i < coin_spawns.length; i++)
    {
        var actor_coin = new Pickup(this.context, [this.image_coin], 0, level, PickupTypes.coin);
        actor_coin.levelGridIndex = coin_spawns[i];
        actor_coin.set_pos(coin_spawns[i][0] * tileSize[0], coin_spawns[i][1] * tileSize[1]);
        this.spawn_actor(actor_coin, true);
    }

    // spawn ammo
    var ammo_spawns = level.getAmmoSpawns();
    for(var i = 0; i < ammo_spawns.length; i++)
    {
        // choose a random projectile
        var randomProjectile = projectile_prototypes[Math.floor(Math.random() * projectile_prototypes.length)];
        var actor_ammo = new Pickup(this.context, [randomProjectile.frames[0]], 0, level, PickupTypes.ammo, randomProjectile);
        actor_ammo.levelGridIndex = ammo_spawns[i];
        actor_ammo.set_pos(ammo_spawns[i][0] * tileSize[0], ammo_spawns[i][1] * tileSize[1]);
        this.spawn_actor(actor_ammo, true);
    }
};

//draw hud
GameSceneManager.prototype.draw_hud = function()
{
    // countdown text
    if(this.countdownToStart > -this.coundownDisplayGoTime)
    {
        this.context.fillStyle = "white";
        this.context.textAlign = "center";

        var text = Math.ceil(this.countdownToStart);
        if(text == 0) text = "GO!";
        this.context.font = "150px 'LondonBetween'";
        this.context.fillText(text, this.context.canvas.width * 0.5, this.context.canvas.height * 0.5 + 30);
    }

    this.context.fillStyle = "white";
    this.context.textAlign = "left";

    // hp text
    this.context.font = "30px 'LondonBetween'";
    var textX = 40,
        textY = this.context.canvas.height - 10;
    var hpText = "Health:";
    this.context.fillText(hpText, textX, textY);

    // hp bar
    var barW = 200,
        barH = 20,
        border = 5,
        barX = textX + 20 + this.context.measureText(hpText).width,
        barY = textY - barH;
    // background
    this.context.beginPath();
    this.context.fillStyle = "black";
    this.context.fillRect(barX - border, barY - border, barW + 2 * border, barH + 2 * border);
    // foreground
    var hpPercent = Math.max(0, this.actor_whakman.health / 100);
    this.context.fillStyle = "red";
    this.context.fillRect(barX, barY, barW * hpPercent, barH);

    // score display
    this.context.fillStyle = "white";
    var scoreText = "Score: " + this.score;
    textX = -textX + this.context.canvas.width - this.context.measureText(scoreText).width;
    this.context.fillText(scoreText, textX, textY);

    // ammo count
    var ammoText = "Ammo: " + this.actor_whakman.projectilePrototypes.length;
    textX -= this.context.measureText(ammoText).width + 60;
    this.context.fillText(ammoText, textX, textY);
}