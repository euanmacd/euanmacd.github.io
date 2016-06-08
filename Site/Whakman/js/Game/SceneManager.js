// scene manager base object - handle updating and drawing a scene
function SceneManager(context, changeSceneCallback)
{
    this.loaded = false;
    
    this.context = context;
    
    this.changeSceneCallback = changeSceneCallback;
}

// perform any asset/data loading
SceneManager.prototype.startLoading = function(width, height)
{
    // load images
    var loader = new PxLoader();

    this.preloadImages(loader);

    // if no resources to load, don't start loading
    if(!loader.isBusy())
    {
        this.loaded = true;
        return;
    }

    var self = this;
    // callback on images loaded 
    loader.addCompletionListener(function() {
        self.loaded = true;
    });

    loader.start()
};

// start preloading images
SceneManager.prototype.preloadImages = function(loader)
{
    
};

// is the scene fully loaded? returns bool
SceneManager.prototype.isLoaded = function()
{
    return this.loaded;
};

// receive input from main loop
SceneManager.prototype.process_input = function(keys_down)
{
    
};

// update 
SceneManager.prototype.update = function(delta_time)
{
    
};

// draw
SceneManager.prototype.draw = function()
{
    
};

// change to a different scene
SceneManager.prototype.changeScene = function(newScene)
{
    this.changeSceneCallback(newScene);
};