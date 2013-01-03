var Game = new function () {

    // Game Initialization
    this.initialize = function (canvasElementId, sprite_data, callback) {
        this.canvas = document.getElementById(canvasElementId);
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.playerOffset = 10;
        this.canvasMultiplier = 1;

        this.ctx = this.canvas.getContext && this.canvas.getContext('2d');
        if (!this.ctx) {
            return alert("Please upgrade your browser to play");
        }

        this.setupInput();
        this.setupMobile();
        //add touch controls
        if(this.mobile) {
            this.setBoard(4,new TouchControls());
        }

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

    this.setupMobile = function () {
        var container = document.getElementById("container"),
            hasTouch = !!('ontouchstart' in window),
            w = window.innerWidth, h = window.innerHeight;

        this.mobile = hasTouch;

        if (screen.width >= 1280 || !hasTouch) {
            return false;
        }
        if (w > h) {
            alert("Please rotate the device and then click OK");
            w = window.innerWidth;
            h = window.innerHeight;
        }
        container.style.height = h * 2 + "px";
        window.scrollTo(0, 1);
        h = window.innerHeight + 2;
        container.style.height = h + "px";
        container.style.width = w + "px";
        container.style.padding = 0;
        if (h >= this.canvas.height * 1.75 ||
            w >= this.canvas.height * 1.75) {
            this.canvasMultiplier = 2;
            this.canvas.width = w / 2;
            this.canvas.height = h / 2;
            this.canvas.style.width = w + "px";
            this.canvas.style.height = h + "px";
        } else {
            this.canvas.width = w;
            this.canvas.height = h;
        }
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = "0px";
        this.canvas.style.top = "0px";
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

var Sprite = function () {
};
Sprite.prototype.setup = function (sprite, props) {

    this.sprite = sprite;
    this.merge(props);
    this.frame = this.frame || 0;

    this.w = SpriteSheet.map[sprite].w;
    this.h = SpriteSheet.map[sprite].h;
};

Sprite.prototype.merge = function (props) {
    if (props) {
        for (var prop in props) {
            this[prop] = props[prop];
        }
    }
};

Sprite.prototype.draw = function (ctx) {
    SpriteSheet.draw(ctx, this.sprite, this.x, this.y, this.frame);
};

Sprite.prototype.hit = function (damage) {
    console.log("hit");
    this.board.remove(this);
};

var Level = function (levelData, callback) {
    this.levelData = [];
    for (var i = 0; i < levelData.length; i++) {
        this.levelData.push(Object.create(levelData[i]));
    }
    this.t = 0;
    this.callback = callback;
};

Level.prototype.step = function (dt) {
    var idx = 0;
    var remove = [];
    var curShip = null;
// Update the current time offset
    this.t += dt * 1000;
// Example levelData
//   Start, End, Gap, Type, Override
// [[ 0,    4000, 500, 'step', { x: 100 } ]
    while ((curShip = this.levelData[idx]) &&
        (curShip[0] < this.t + 2000)) {
// Check if past the end time
        if (this.t > curShip[1]) {
// If so, remove the entry
            remove.push(curShip);
        } else if (curShip[0] < this.t) {
// Get the enemy definition blueprint
            var enemy = enemies[curShip[3]],
                override = curShip[4];
// Add a new enemy with the blueprint and override
            this.board.add(new Enemy(enemy, override));
// Increment the start time by the gap
            curShip[0] += curShip[2];
        }
        idx++;
    }
// Remove any objects from the levelData that have passed
    for (var i = 0, len = remove.length; i < len; i++) {
        var idx = this.levelData.indexOf(remove[i]);
        if (idx != -1) this.levelData.splice(idx, 1);
    }
// If there are no more enemies on the board or in
// levelData, this level is done
    if (this.levelData.length == 0 && this.board.cnt[OBJECT_ENEMY] == 0) {
        if (this.callback) this.callback();
    }
};
// Dummy method, doesn't draw anything
Level.prototype.draw = function (ctx) {
};

// controls for touch screens on mobile devices
var TouchControls = function () {

    // a margin of 10 pixels between th buttons
    var gutterWidth = 10;
    // dividing the screen into 5 parts to place and resize the buttons
    // 5 is chosen arbitrarily
    var unitWidth = Game.width / 5;

    //the actual button size (without gutter)
    var blockWidth = unitWidth - gutterWidth;

    this.drawSquare = function (ctx, x, y, txt, on) {

        //set the alpha according to button state (on/off)
        ctx.globalAlpha = on ? 0.9 : 0.6;
        //grey button
        ctx.fillStyle = "#CCC";
        ctx.fillRect(x, y, blockWidth, blockWidth);
        //with white text
        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.globalAlpha = 1.0;
        ctx.font = "bold " + (3 * unitWidth / 4) + "px arial";
        ctx.fillText(txt,
            x + blockWidth / 2,
            y + 3 * blockWidth / 4 + 5);
    };

    this.draw = function (ctx) {

        //pushing the context, to be able to restore all setting after we're done
        ctx.save();
        var yLoc = Game.height - unitWidth;
        //using unicode symbols for left and right arrows for controls
        this.drawSquare(ctx, gutterWidth, yLoc,
            "\u25C0", Game.keys['left']);
        this.drawSquare(ctx, unitWidth + gutterWidth, yLoc,
            "\u25B6", Game.keys['right']);
        this.drawSquare(ctx, 4 * unitWidth, yLoc, "A", Game.keys['fire']);

        //restoring canvas settings
        ctx.restore();
    };
    this.step = function (dt) {
    };

    this.trackTouch = function (e) {
        console.log("touch event processing started");
        var touch, x;
        e.preventDefault();
        Game.keys['left'] = false;
        Game.keys['right'] = false;
        for (var i = 0; i < e.targetTouches.length; i++) {
            touch = e.targetTouches[i];
            x = touch.pageX / Game.canvasMultiplier - Game.canvas.offsetLeft;
            if (x < unitWidth) {
                Game.keys['left'] = true;
            }
            if (x > unitWidth && x < 2 * unitWidth) {
                Game.keys['right'] = true;
            }
        }
        if (e.type == 'touchstart' || e.type == 'touchend') {
            for (i = 0; i < e.changedTouches.length; i++) {
                touch = e.changedTouches[i];
                x = touch.pageX / Game.canvasMultiplier - Game.canvas.offsetLeft;
                if (x > 4 * unitWidth) {
                    Game.keys['fire'] = (e.type == 'touchstart');
                }
            }
        }
    };
    Game.canvas.addEventListener('touchstart', this.trackTouch, true);
    Game.canvas.addEventListener('touchmove', this.trackTouch, true);
    Game.canvas.addEventListener('touchend', this.trackTouch, true);
    // shifting the player above the onscreen buttons
    Game.playerOffset = unitWidth + 20;
};

var GamePoints = function() {
    Game.points = 0;
    var pointsLength = 8;
    this.draw = function(ctx) {
        ctx.save();
        ctx.font = "bold 18px arial";
        ctx.fillStyle= "#FFFFFF";
        var txt = "" + Game.points;
        var i = pointsLength - txt.length, zeros = "";
        while(i-- > 0) { zeros += "0"; }
        ctx.fillText(zeros + txt,10,20);
        ctx.restore();
    };
    this.step = function(dt) { }
};




