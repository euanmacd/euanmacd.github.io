// level generator/manager.
var Level = function(tile_w, tile_h)
{
    var level = {};

    var tile_w = tile_w;
    var tile_h = tile_h;
    level.getTileSize = function() { return [tile_w, tile_h]; };
    level.getLevelDimensions = function() { return [tile_w * currentLevelGrid[0].length, tile_h * currentLevelGrid.length]; };

    var image_background = null;
    var image_wall_cross = null;
    var image_wall_straight = null;
    var image_wall_end = null;
    var image_wall_t = null;
    var image_wall_turn = null;

    var currentLevelGrid = [];
    var currentLevelData = [];
    var ghostHomeTile;

    // map points
    var P = 2; // player spawn
    var G = 3; // ghost spawn
    var H = 4; // ghost home
    var C = 5; // gold coin
    var A = 6; // ammo
    level.tileType_ghostHome = function(){ return H; };
    
    // spawn points
    var ghost_spawns = [];
    level.getGhostSpawns = function(){ return ghost_spawns; };
    var player_spawn = [0, 0];
    level.getPlayerSpawn = function(){ return player_spawn; };
    var ghost_home = [0, 0];
    level.getGhostHome = function(){ return ghost_home; };

    // pickups
    var coin_spawns = [];
    level.getCoinSpawns = function(){ return coin_spawns; };
    var ammo_spawns = [];
    level.getAmmoSpawns = function(){ return ammo_spawns; };

    // load assets
    level.preload_images = function(loader)
    {
        image_wall_cross = loader.addImage("images/wall_cross.png")
        image_wall_straight = loader.addImage("images/wall_straight.png")
        image_wall_end = loader.addImage("images/wall_end.png")
        image_wall_t = loader.addImage("images/wall_t.png")
        image_wall_turn = loader.addImage("images/wall_turn.png")
        image_background = loader.addImage("images/background.png")
    };
    
    // regular game layout
    level.getGameSceneGrid = function()
    {
        return [
            [C, 1, 1, C, G, A, C, 1, 1, G, C],
            [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
            [1, A, C, 1, 1, C, 1, 1, C, A, 1],
            [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, C],
            [P, A, 1, C, 1, H, 1, C, 1, A, G],
            [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, C],
            [1, A, C, 1, 1, C, 1, 1, C, A, 1],
            [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
            [C, 1, 1, C, G, A, 1, C, 1, G, C],
            ];
    };

    // generate a new level
    level.generate = function(cells)
    {
        // discard any existing data
        currentLevelData = [];

        currentLevelGrid = cells;

        var x = 0;
        var y = 0;

        // loop through all cells
        for(var yi = 0; yi < cells.length; yi++)
        {
            for(var xi = 0; xi < cells[yi].length; xi++)
            {
                if(xi != 0)
                    x += tile_w;

                // zero cells are empty
                if(cells[yi][xi] != 0)
                {
                    switch(cells[yi][xi])
                    {
                        case P:
                            player_spawn = [xi, yi];
                            break;
                        case G:
                            ghost_spawns.push([xi, yi]);
                            break;
                        case A:
                            ammo_spawns.push([xi, yi]);
                            break;
                        case C:
                            coin_spawns.push([xi, yi]);
                            break;
                        case H:
                            ghost_home = [xi, yi];
                            // add to levEl data
                            ghostHomeTile = {
                                image:image_background,
                                rotation:0,
                                x:x,
                                y:y,
                                xi:xi,
                                yi:yi,
                                scale:[tile_w/512,tile_h/480]
                            };
                            continue; // this tile is done
                    }
                    
                    // check surrounding cells, values are true if next to a filled cell in that direction
                    var left = (xi - 1 >= 0) && (cells[yi][xi - 1] != 0);
                    var right = (xi + 1 < cells[yi].length) && (cells[yi][xi + 1] != 0);
                    var up = (yi - 1 >= 0) && (cells[yi - 1][xi] != 0);
                    var down = (yi + 1 < cells.length) && (cells[yi + 1][xi] != 0);

                    // count surrounding filled cells
                    var totalConnections = 0;
                    if (left) totalConnections++;
                    if (right) totalConnections++;
                    if (up) totalConnections++;
                    if (down) totalConnections++;

                    var rotation = 0;
                    var tile;

                    // determine cell image and rotation based on surrounding cells
                    switch (totalConnections)
                    {
                        case 1:
                            if(left) rotation = -0.5 * Math.PI;
                            else if(right) rotation = 0.5 * Math.PI;
                            else if(down) rotation = Math.PI;
                            tile = image_wall_end;
                            break;
                        case 2:
                            if ((left && right) || (up && down))
                            {
                                tile = image_wall_straight;
                                if(up) rotation = 0.5 * Math.PI;
                            }
                            else
                            {
                                tile = image_wall_turn;
                                if(left && down) rotation = 0.5 * Math.PI;
                                else if(left && up) rotation = Math.PI;
                                else if(right && up) rotation = 1.5 * Math.PI;
                            }
                            break;
                        case 3:
                            tile = image_wall_t;
                            if(!down) rotation = 0.5 * Math.PI;
                            else if(!left) rotation = Math.PI;
                            else if(!up) rotation = 1.5 * Math.PI;
                            break;
                        case 4:
                            tile = image_wall_cross;
                            break;
                    }

                    // add to levl data
                    currentLevelData.push({
                        image:tile,
                        rotation:rotation,
                        x:x,
                        y:y,
                        xi:xi,
                        yi:yi,
                        scale:[1,1]
                    });
                }
            }

            x = 0;
            y += tile_h;
        }
    };
    
    level.isCellWithinGrid = function(indexX, indexY)
    {
        return !(indexX < 0 ||
            indexY < 0 ||
            indexY >= currentLevelGrid.length ||
            indexX >= currentLevelGrid[0].length);
    };

    // get the type of cell at index x,y
    level.getCellType = function(x, y)
    {
        if(!level.isCellWithinGrid(x, y))
            return 0;
        return currentLevelGrid[y][x];
    };
    
    // check what is at world point x,y
    level.getTypeAtWorldPoint = function(x, y)
    {
        return level.getCellType(Math.round(x / tile_w), Math.round(y / tile_h));
    };

    // draw level
    level.draw = function(context)
    {
        level.drawTiles(context, currentLevelData);
    };
    
    // draw top layer
    level.drawLate = function(context)
    {
        level.drawTiles(context, [ghostHomeTile]);
    }

    level.drawTiles = function(context, tileData)
    {
        for(var i = 0; i < tileData.length; i++)
        {
            var data = tileData[i];
            // draw this cell
            context.save();
            context.translate(data.x + tile_w * 0.5, data.y + tile_h * 0.5);
            context.rotate(data.rotation);
            context.scale(data.scale[0], data.scale[1]);
            context.drawImage(data.image, -tile_w * 0.5 * (1 / data.scale[0]), -tile_h * 0.5 * (1 / data.scale[1]));
            context.restore();
        }
    };

    // return the location of a random node
    level.getRandomPoint = function()
    {
        var node = currentLevelData[Math.floor(Math.random() * currentLevelData.length)];
        return [node.x, node.y, node.xi, node.yi];
    };

    // use A* pathfinding to find shortest route from xA,yA to xB,yB (grid indices)
    // route returned as an array of waypoints
    level.findRoute = function(xA, yA, xB, yB)
    {
        // if start == end, return empty path
        if(xA == xB && yA == yB)
            return [];

        function node(parent, x, y)
        {
            this.parent = parent;
            this.x = x;
            this.y = y;
            this.totalCost = 0;
            this.costFromStart = 0;
            this.costToEnd = 0;
        }

        var openNodes = [];
        var closedNodes = [];
        var targetNode = null;

        // add starting node
        openNodes.push(new node(null, xA, yA));

        // loop until we have a result
        while(openNodes.length > 0 && targetNode == null)
        {
            var parentNode = openNodes[0];
            var parentOpenIndex = 0;
            // find cheapest open node as parent
            for(var i = 1; i < openNodes.length; i++)
            {
                if(openNodes[i].totalCost < parentNode.totalCost)
                {
                    parentNode = openNodes[i];
                    parentOpenIndex = i;
                }
            }
            // remove parent from open list
            openNodes.splice(parentOpenIndex, 1);

            // check each surrounding node of parent
            for(var y = parentNode.y - 1; y <= parentNode.y + 1 && targetNode == null; y++)
            {
                // skip if off grid
                if(y < 0 || y >= currentLevelGrid.length)
                    continue;

                for(var x = parentNode.x - 1; x <= parentNode.x + 1; x++)
                {
                    // skip if off grid
                    if(x < 0 || x >= currentLevelGrid[y].length)
                        continue;
                    // skip if node is parent
                    if(parentNode.y == y && parentNode.x == x)
                        continue;
                    // skip if not traversable
                    if(currentLevelGrid[y][x] == 0)
                        continue;
                    // skip diagonal movement (either x or y offset must be zero)
                    if(parentNode.y != y && parentNode.x != x)
                        continue;

                    var checkNode = new node(parentNode, x, y);

                    // reached destination?
                    if(x == xB && y == yB)
                    {
                        targetNode = checkNode;
                        break;
                    }

                    checkNode.costFromStart = parentNode.costFromStart + 1;
                    checkNode.costToEnd = Math.sqrt(Math.pow(xB - x, 2) + Math.pow(yB - y, 2));
                    checkNode.totalCost = checkNode.costFromStart + checkNode.costToEnd;

                    var skipNode = false;

                    // check if a cheaper version of thise node exists in open/closed lists
                    for(var i = 0; i < 2 && !skipNode; i++)
                    {
                        var list = i == 0 ? openNodes : closedNodes;
                        for(var n = 0; n < list.length; n++)
                        {
                            if(list[n].x == x && list[n].y == y)
                            {
                                if(list[n].totalCost <= checkNode.totalCost)
                                {
                                    skipNode = true;
                                    break;
                                }
                            }
                        }
                    }

                    // valid node, add to open list
                    if(!skipNode)
                    {
                        openNodes.push(checkNode);
                    }
                }
            }

            // add parent to closed list
            closedNodes.push(parentNode);
        }

        // if we found a path
        if(targetNode != null)
        {
            var path = [];

            // follow parent chain backwards from target to compile list of waypoints
            var parentNode = targetNode;
            while(parentNode.parent)
            {
                // offset from this node to its parent
                var waypoint = [parentNode.x * tile_w, parentNode.y * tile_h];

                // if last 2 waypoints and this new waypoint make a line,
                // we can just replace the last waypoint with this one
                if(path.length > 1)
                {
                    var endPath1 = path[path.length - 1];
                    var endPath2 = path[path.length - 2];
                    
                    if((waypoint[0] == path[path.length - 1][0] && waypoint[0] == path[path.length - 2][0]) ||
                        (waypoint[1] == path[path.length - 1][1] && waypoint[1] == path[path.length - 2][1]))
                    {
                        // pop the previous waypoint, new waypoint will be pushed to repalce it
                        path.pop();
                    }
                }
                
                path.push(waypoint);

                parentNode = parentNode.parent;
            }

            // reverse the order of the path since we started from target point
            path.reverse();

            return path;
        }

        // return empty path
        return [];
    };

    return level;
};






























