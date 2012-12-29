var Game = new function() {

    // Game Initialization
    this.initialize = function(canvasElementId,sprite_data,callback) {
        this.canvas = document.getElementById(canvasElementId);
        this.width = this.canvas.width;
        this.height= this.canvas.height;

        this.ctx = this.canvas.getContext && this.canvas.getContext('2d');
        if(!this.ctx) { return alert("Please upgrade your browser to play"); }

        this.setupInput();

        this.loop();

        SpriteSheet.load(sprite_data,callback);
    };

    // Handle Input
    var KEY_CODES = { 37:'left', 39:'right', 32 :'fire' };
    this.keys = {};

    this.setupInput = function() {
        window.addEventListener('keydown',function(event) {
            if(KEY_CODES[event.keyCode]) {
                Game.keys[KEY_CODES[event.keyCode]] = true;
                event.preventDefault();
            }
        },false);

        window.addEventListener('keyup',function(event) {
            if(KEY_CODES[event.keyCode]) {
                Game.keys[KEY_CODES[event.keyCode]] = false;
                event.preventDefault();
            }
        },false);
    };

    // Game Loop
    var boards = [];

    this.loop = function() {
        //we are just assuming that this is our frame length in ms., based on the timeout settings
        var dt = 30 / 1000;

        for(var i=0,len = boards.length;i<len;i++) {
            if(boards[i]) {
                boards[i].step(dt);
                boards[i].draw(Game.ctx);
            }
        }
        // defining a one.time callback
        // the execution environment is not available at callback, so we cannot use this.loop here
        // although honestly i cannot understand why it is important where the function ref comes from
        // TODO: and what about the execution time of the function - is it just appended t the 30ms?
        setTimeout(Game.loop,30);
    };

    // Change an active game board
    this.setBoard = function(num,board) { boards[num] = board; };
};


var SpriteSheet = new function() {
    this.map = { };

    this.load = function(spriteData,callback) {
        this.map = spriteData;
        this.image = new Image();
        this.image.onload = callback;
        this.image.src = 'img/sprites.png';
    };

    this.draw = function(ctx,sprite,x,y,frame) {
        var s = this.map[sprite];
        if(!frame) frame = 0;
        ctx.drawImage(this.image,
            s.sx + frame * s.w,
            s.sy,
            s.w, s.h,
            Math.floor(x), Math.floor(y),
            s.w, s.h);
    };
};

// just displaying the title and subtitle
var TitleScreen = function TitleScreen(title,subtitle,callback) {
    var up = false;

    this.step = function(dt) {
        if(!Game.keys['fire']) up = true;
        if(up && Game.keys['fire'] && callback) callback();
    };

    this.draw = function(ctx) {

        // white centered text
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";

        ctx.font = "bold 40px bangers";
        ctx.fillText(title,Game.width/2,Game.height/2);

        ctx.font = "bold 20px bangers";
        ctx.fillText(subtitle,Game.width/2,Game.height/2 + 40);
    };
};