var Game = new function () {

    // Game Initialization
    this.initialize = function (canvasElementId, sprite_data, callback) {
        this.canvas = document.getElementById(canvasElementId);
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.ctx = this.canvas.getContext && this.canvas.getContext('2d');
        if (!this.ctx) {
            return alert("Please upgrade your browser to play");
        }

        this.setupInput();

        this.loop();

        SpriteSheet.load(sprite_data, callback);
    };

    // Handle Input
    var KEY_CODES = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 32: 'fire' };
    this.keys = {};

    this.setupInput = function () {
        window.addEventListener('keydown', function (event) {
            if (KEY_CODES[event.keyCode]) {
                Game.keys[KEY_CODES[event.keyCode]] = true;
                event.preventDefault();
            }
        }, false);

        window.addEventListener('keyup', function (event) {
            if (KEY_CODES[event.keyCode]) {
                Game.keys[KEY_CODES[event.keyCode]] = false;
                event.preventDefault();
            }
        }, false);
    };

    // Game Loop
    var boards = [];

    this.loop = function () {
        //we are just assuming that this is our frame length in ms., based on the timeout settings
        var dt = 30 / 1000;

        //drawing a black rect over the whole screen
        var backupStyle = Game.ctx.fillStyle;
        Game.ctx.fillStyle = "#000";
        Game.ctx.clearRect(0, 0, Game.width, Game.height);
        Game.ctx.fillStyle = backupStyle;

        for (var i = 0, len = boards.length; i < len; i++) {
            if (boards[i]) {
                boards[i].step(dt);
                boards[i].draw(Game.ctx);
            }
        }
        // defining a one.time callback
        // the execution environment is not available at callback, so we cannot use this.loop here
        // although honestly i cannot understand why it is important where the function ref comes from
        // TODO: and what about the execution time of the function - is it just appended to the 30ms?
        setTimeout(Game.loop, 30);
    };

    // Change an active game board
    this.setBoard = function (num, board) {
        boards[num] = board;
    };
};


var SpriteSheet = new function () {
    this.map = { };

    this.load = function (spriteData, callback) {
        this.map = spriteData;
        this.image = new Image();
        this.image.onload = callback;
        this.image.src = 'img/sprites.png';
    };

    this.draw = function (ctx, sprite, x, y, frame) {
        var s = this.map[sprite];
        if (!frame) frame = 0;
        ctx.drawImage(this.image,
            s.sx + frame * s.w,
            s.sy,
            s.w, s.h,
            Math.floor(x), Math.floor(y),
            s.w, s.h);
    };
};

// just displaying the title and subtitle
var TitleScreen = function TitleScreen(title, subtitle, callback) {
    var up = false;

    this.step = function (dt) {
        if (!Game.keys['fire']) up = true;
        if (up && Game.keys['fire'] && callback) callback();
    };

    this.draw = function (ctx) {

        // white centered text
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";

        ctx.font = "bold 40px bangers";
        ctx.fillText(title, Game.width / 2, Game.height / 2);

        ctx.font = "bold 20px bangers";
        ctx.fillText(subtitle, Game.width / 2, Game.height / 2 + 40);
    };
};

var GameBoard = function () {
    var board = this;
// The current list of objects
    this.objects = [];
    this.cnt = [];
// Add a new object to the object list
    this.add = function (obj) {
        obj.board = this;
        this.objects.push(obj);
        this.cnt[obj.type] = (this.cnt[obj.type] || 0) + 1;
        return obj;
    };
    // Mark an object for removal
    this.remove = function (obj) {
        console.log("board.remove called");
        var wasStillAlive = this.objects.indexOf(obj) != -1;
        if (wasStillAlive) {
            console.log("was still alive, so removing");
            this.removed.push(obj);
        }
        return wasStillAlive;
    };
// Reset the list of removed objects
    this.resetRemoved = function () {
        this.removed = [];
    };

// Remove objects marked for removal from the list
    this.finalizeRemoved = function () {
        for (var i = 0, len = this.removed.length; i < len; i++) {
            console.log("removing " + len + " objects");
            var idx = this.objects.indexOf(this.removed[i]);
            if (idx != -1) {
                console.log("removing from objects: " + this);
                this.cnt[this.removed[i].type]--;
                this.objects.splice(idx, 1);
            }
        }
    };

// Call the same method on all current objects
    this.iterate = function (funcName) {
        var args = Array.prototype.slice.call(arguments, 1);
        for (var i = 0, len = this.objects.length; i < len; i++) {
            var obj = this.objects[i];
            obj[funcName].apply(obj, args)
        }
    };

// Find the first object for which func is true
    this.detect = function (func) {
        for (var i = 0, val = null, len = this.objects.length; i < len; i++) {
            if (func.call(this.objects[i])) return this.objects[i];
        }
        return false;
    };

// Call step on all objects and then delete
// any objects that have been marked for removal
    this.step = function (dt) {
        this.resetRemoved();
        this.iterate('step', dt);
        this.finalizeRemoved();
    };

// Draw all the objects
    this.draw = function (ctx) {
        this.iterate('draw', ctx);
    };

    this.overlap = function (o1, o2) {
        return !((o1.y + o1.h - 1 < o2.y) || (o1.y > o2.y + o2.h - 1) ||
            (o1.x + o1.w - 1 < o2.x) || (o1.x > o2.x + o2.w - 1));
    };

    this.collide = function (obj, type) {
        return this.detect(function () {
            if (obj != this) {
                var col = (!type || this.type & type) && board.overlap(obj, this);
                return col ? this : false;
            }
        });
    };
};

var Sprite = function() { };
Sprite.prototype.setup = function(sprite,props) {

    this.sprite = sprite;
    this.merge(props);
    this.frame = this.frame || 0;

    this.w = SpriteSheet.map[sprite].w;
    this.h = SpriteSheet.map[sprite].h;
};

Sprite.prototype.merge = function(props) {
    if(props) {
        for (var prop in props) {
            this[prop] = props[prop];
        }
    }
};

Sprite.prototype.draw = function(ctx) {
    SpriteSheet.draw(ctx,this.sprite,this.x,this.y,this.frame);
};

Sprite.prototype.hit = function(damage) {
    console.log("hit");
    this.board.remove(this);
};

