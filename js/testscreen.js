//object types for collision detection
var OBJECT_PLAYER = 1,
    OBJECT_PLAYER_PROJECTILE = 2,
    OBJECT_ENEMY = 4,
    OBJECT_ENEMY_PROJECTILE = 8,
    OBJECT_POWERUP = 16;


//the sprites are passed to th Game,initialize func, then from there to the SpriteSheet.load method
var sprites = {
    ship: { sx: 0, sy: 0, w: 39, h: 42, frames: 1 },
    missile: { sx: 0, sy: 30, w: 2, h: 10, frames: 1 },
    enemy_purple: { sx: 37, sy: 0, w: 42, h: 43, frames: 1 },
    enemy_bee: { sx: 79, sy: 0, w: 37, h: 43, frames: 1 },
    enemy_ship: { sx: 116, sy: 0, w: 42, h: 43, frames: 1 },
    enemy_circle: { sx: 158, sy: 0, w: 32, h: 33, frames: 1 }

};

var enemies = {
    basic: { x: 100, y: -50, sprite: 'enemy_purple', B: 100, C: 2, E: 100 }
};


var startGame = function () {

    var board = new GameBoard();
    board.add(new PlayerShip());
    board.add(new WireframeSprite(100, 100));
    board.add(new WireframeSprite(150, 150));
    Game.setBoard(3, board);
};

window.addEventListener("load", function () {
    Game.initialize("game", sprites, startGame);

});

//---------------------------
// PlayerShip
var PlayerShip = function () {

    this.setup('ship', { vx: 0, frame: 1, reloadTime: 0.25, maxVel: 200 });
    this.reload = this.reloadTime;
    this.x = Game.width / 2 - this.w / 2;
    this.y = Game.height - 10 - this.h;

    this.step = function (dt) {
        if (Game.keys['left']) {
            this.vx = -this.maxVel;
        }
        else if (Game.keys['right']) {
            this.vx = this.maxVel;
        }
        else {
            this.vx = 0;
        }
        this.x += this.vx * dt;
        if (this.x < 0) {
            this.x = 0;
        }
        else if (this.x > Game.width - this.w) {
            this.x = Game.width - this.w
        }
        this.reload -= dt;
        if (Game.keys['fire'] && this.reload < 0) {
            this.reload = this.reloadTime;
            this.board.add(new PlayerMissile(this.x, this.y + this.h / 2));
            this.board.add(new PlayerMissile(this.x + this.w, this.y + this.h / 2));
        }
    };

    this.draw = function (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = "#FF0";
        ctx.strokeRect(this.x, this.y, this.w, this.h);
    };
};
PlayerShip.prototype = new Sprite();
PlayerShip.prototype.type = OBJECT_PLAYER;


//---------------------------
// PlayerMissile
var PlayerMissile = function (x, y) {

    this.setup('missile', { vy: -700, damage: 10 });
    this.x = x - this.w / 2;
    this.y = y - this.h;
};
PlayerMissile.prototype = new Sprite();
PlayerMissile.prototype.type = OBJECT_PLAYER_PROJECTILE;
PlayerMissile.prototype.step = function (dt) {

    this.y += this.vy * dt;
    var collision = this.board.collide(this, OBJECT_ENEMY);
    if (collision) {
        collision.hit(this.damage);
        this.board.remove(this);
    } else if (this.y < -this.h) {
        this.board.remove(this);
    }
};

var WireframeSprite = function (x, y) {

    this.x = x;
    this.y = y;

    this.w = 100;
    this.h = 100;

    this.colliding = false;

    this.step = function(dt){this.colliding = false;
     };
    this.hit = function(damage){
        this.colliding = true;
    };

    this.draw = function (ctx) {

        if (this.colliding) {
            ctx.fillStyle = "#FF0000";
        } else {
            ctx.fillStyle = "#FFFFFF";
        }
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = "#FFFF00";
        ctx.strokeRect(this.x, this.y, this.w, this.h);
    };
};
WireframeSprite.prototype.type = OBJECT_ENEMY;




