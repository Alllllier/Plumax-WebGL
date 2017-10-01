// todo 多人同时胜利，判断
// todo 移动未吸附，放回原位

// Alias
let Container = PIXI.Container,
    ParticleContainer = PIXI.ParticleContainer,
    autoDetectRender = PIXI.autoDetectRenderer,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Graphics = PIXI.Graphics,
    Sprite = PIXI.Sprite;

// PIXI全局
let stage, winStage, renderer, state;

// GUI全局
let center = {};

// 游戏全局
let locations = [], pieces = [], starts = [], players = [];

let Port = {
    DOUBLE: 0,
    OUT: 1,
    CLOSED: 2
};


const SIDE_S = 50, // 边长
    SIDE_M = SIDE_S / 2 * Math.sqrt(3); // 中垂线

$(document).ready(function () {
    stage = new Container();
    winStage = new Container();
    renderer = new autoDetectRender(1024, 640);
    renderer.backgroundColor = 0xFFFFFF;
    $('#main').append(renderer.view);
    loader
        .add('images/board.png')
        .add('images/oneway.png')
        .add('images/oneway-active.png')
        .add('images/singo.png')
        .add('images/singo-active.png')
        .add('images/trigo.png')
        .add('images/trigo-active.png')
        .add('images/destroy.png')
        .load(setup);
});

// 准备工作放在这里
function setup() {
    state = playState;

    // todo 整合方法
    let title = new PIXI.Text(
        'PLUMAX-WEB BETA',
        {font: '36px impact', fill: 0xf55066}
    );
    title.x = renderer.view.width / 2 - title.width / 2;
    title.y = 10;
    stage.addChild(title);

    // todo 整合方法
    let board = new Sprite(resources['images/board.png'].texture);
    board.width = SIDE_S * 9;
    board.height = SIDE_M * 12;
    board.x = renderer.view.width / 2 - board.width / 2;
    board.y = 70;
    center.x = board.x + board.width / 2;
    center.y = board.y + board.height / 2;
    stage.addChild(board);

    // 加载locations
    for (let i = 1; i <= 6; i++) {
        for (let j = 1; j <= 2; j++) {
            for (let x = 1; x <= 3; x++) {
                for (let y = 1; y <= 2 * x - 1; y++) {
                    if (!(j === 1 && x === 1 && y === 1)) {
                        locations.push(new Location(i, j, x, y));
                    }
                }
            }
        }
    }

    // 顶点终点互相指向
    for (let i = 0; i < locations.length; i++) {
        let location1 = locations[i];
        if (location1.isStart()) {
            for (let j = 0; j < locations.length; j++) {
                let location2 = locations[j];
                if (location2.isStart()) {
                    if (Math.abs(location1.block - location2.block) === 3) {
                        location1.oppositeEnd = location2;
                        location2.oppositeEnd = location1;
                    }
                }
            }
        }
    }

    // 测试旗标
    // for (let i = 0; i < locations.length; i++) {
    //     let point = new LocationFlag(locations[i]);
    //     stage.addChild(point);
    // }

    // 测试棋子
    // for (let i = 0; i < 3; i++) {
    //     let singo = new Singo();
    //     singo.setPosition(70 * (i + 1), 450);
    //     stage.addChild(singo.sprite);
    // }
    //
    // for (let i = 0; i < 3; i++) {
    //     let trigo = new Trigo();
    //     trigo.setPosition(70 * (i + 1), 510);
    //     stage.addChild(trigo.sprite);
    // }
    //
    // for (let i = 0; i < 3; i++) {
    //     let trigo = new Oneway();
    //     trigo.setPosition(70 * (i + 1), 570);
    //     stage.addChild(trigo.sprite);
    // }
    //
    // for (let i = 0; i < 3; i++) {
    //     let trigo = new Destroy();
    //     trigo.setPosition(70 * (i + 1), 630);
    //     stage.addChild(trigo.sprite);
    // }

    for (let i = 1; i <= 3; i++) {
        let player = new Player(i);
        player.initialize();
        players.push(player);
    }

    gameLoop();
}

function gameLoop() {
    requestAnimationFrame(gameLoop);
    state();
}

function playState() {
    renderer.render(stage);
}

function winState() {
    renderer.render(winStage);
}

function Location(block, section, row, column) {
    this.block = block;
    this.section = section;
    this.row = row;
    this.column = column;
    this.to = [];
    this.from = [];
    this.piece = undefined;

    if (section === 1) {
        this.x = center.x + (-row + column) / 2 * SIDE_S;
        this.y = column % 2 === 1 ? center.y - (19 / 3 - row) * SIDE_M : center.y - (20 / 3 - row) * SIDE_M;
    } else {
        this.x = center.x - (-row + column) / 2 * SIDE_S;
        this.y = column % 2 === 1 ? center.y - (-1 / 3 + row) * SIDE_M : center.y - (-2 / 3 + row) * SIDE_M;
    }

    this.blockRotation = block - 1;
    this.rotate(this.blockRotation); // 第一区不用转

    // 位置朝向
    this.up = column % 2 === 1;
    // if (section === 2) {
    //     this.up = !this.up;
    // }
}

Location.prototype = {
    rotate: function (times) {
        let radius = 60 / 360 * 2 * Math.PI;
        for (let i = 0; i < times; i++) {
            let newX = (this.x - center.x) * Math.cos(radius)
                - (this.y - center.y) * Math.sin(radius) + center.x;
            let newY = (this.x - center.x) * Math.sin(radius)
                + (this.y - center.y) * Math.cos(radius) + center.y;
            this.x = newX;
            this.y = newY;
        }
    },
    isStart: function () {
        return this.section === 1 && this.row === 2 && this.column === 2;
    }
};


// 测试类，位置旗标
function LocationFlag(location) {
    let point = new Graphics();
    point.beginFill(0);
    point.drawCircle(0, 0, 10);
    point.endFill();
    point.x = location.x;
    point.y = location.y;
    return point;
}

// 抽象类，表示一个棋子
// 属性： rotation 1-6 表示旋转
//       ports[] 表示端口种类
//       location 所在location指向
//       player 拥有者
// 方法： setPosition(x, y) 设置sprite的位置
//       activate() 设置sprite纹理为active
//       deactivate() 设置sprite纹理为正常
//       todo place(location) 在location上放置棋子 或者 player.placePiece(location, piece)
function Piece() {
    this.sprite = undefined;
    this.location = undefined;
    this.rotation = 1;
    this.player = undefined;
}
Piece.prototype.setPosition = function (x, y) {
    this.sprite.position.set(x, y);
};
Piece.prototype.setSprite = function () {
    this.sprite.anchor.set(0.5, 2 / 3);
    this.sprite.interactive = true;
    // todo 移动端touch
    this.sprite
        .on('mousedown', onPieceClickStart) // touchstart
        .on('touchstart', onPieceClickStart)
        .on('mouseup', onPieceClickEnd) // touchend
        .on('touchend', onPieceClickEnd)
        .on('mouseupoutside', onPieceClickEnd) // touchendoutside
        .on('touchendoutside', onPieceClickEnd)
        .on('mousemove', onPieceClickMove) // touchmove
        .on('touchmove', onPieceClickMove);
    this.sprite.father = this;
    this.sprite.attach = attach;
};

function attach() {
    for (let i = 0; i < locations.length; i++) {
        let distance = Math.sqrt(Math.pow(locations[i].x - this.x, 2) + Math.pow(locations[i].y - this.y, 2));
        let direction = locations[i].up;
        if (locations[i].section === 2) {
            direction = !direction;
        }
        if (distance < Math.floor(1 / 3 * SIDE_M)
            && ((this.father.rotation % 2 === locations[i].block % 2 && direction)
            || (this.father.rotation % 2 !== locations[i].block % 2 && !direction))) { // 位置正确

            let piece = this.father;
            let player = piece.player;

            let placed = false; // 棋子是否被放置

            if (piece instanceof Destroy) {
                if (locations[i].piece) { // 位置上有棋子
                    let originalPiece = locations[i].piece;
                    locations[i].piece = undefined;

                    for (let j = 0; j < locations[i].from.length; j++) {
                        let fromLocation = locations[i].from[j];
                        fromLocation.to.splice(fromLocation.to.indexOf(locations[i]), 1);
                    }
                    locations[i].from = [];
                    locations[i].to = [];
                    pieces.splice(pieces.indexOf(originalPiece), 1);
                    if (locations[i].isStart()) {
                        starts.splice(starts.indexOf(locations[i]), 1);
                    }
                    originalPiece.sprite.parent.removeChild(originalPiece.sprite);
                    this.parent.removeChild(this);
                    placed = true
                }
            } else {
                if (!locations[i].piece) { // 位置上没有棋子
                    // 吸附
                    this.x = locations[i].x;
                    this.y = locations[i].y;
                    this.interactive = false;
                    pieces.push(piece);

                    // 根据旋转及block改变端口排序
                    // rotation 补偿
                    for (let j = 0; j < this.father.rotation - 1; j++) {
                        piece.ports.push(piece.ports.shift());
                    }
                    // block 补偿
                    for (let j = 0; j < locations[i].block - 1; j++) {
                        piece.ports.unshift(piece.ports.pop());
                    }

                    // 建立相互指向
                    locations[i].piece = piece;
                    piece.location = locations[i];

                    // 更新链接
                    updateConnection(piece);

                    if (locations[i].isStart() && piece.ports[2] === Port.DOUBLE) {
                        starts.push(locations[i]);
                    }

                    placed = true;
                }
            }

            if (placed) {
                let index = player.pieces.indexOf(piece);
                player.pieces.splice(index, 1); // 移除
                let newPiece = randomPiece();
                newPiece.player = player;
                player.pieces.splice(index, 0, newPiece); // 添加
                player.printPieces();
            }

            activateRoutes();

            checkGameOver();
        }
    }
}

function onPieceClickStart(event) {
    this.data = event.data;
    this.alpha = 0.7;
    this.scale.set(1.2, 1.2);
    this.dragging = true;
    this.moved = false;
    this.parent.addChild(this); // 将棋子sprite置顶
}

function onPieceClickEnd() {
    this.alpha = 1;
    this.scale.set(1, 1);
    this.dragging = false;
    this.data = null;
    if (!this.moved) {
        this.father.rotation += 1;
        if (this.father.rotation === 7) {
            this.father.rotation = 1;
        }
        this.rotation += 1 / 3 * Math.PI;
    }
    this.attach();
    this.moved = false;
}

function onPieceClickMove() {
    if (this.dragging) {
        let newPosition = this.data.getLocalPosition(this.parent);
        this.position.x = newPosition.x;
        this.position.y = newPosition.y;
        this.moved = true;
    }
}


function Singo() {
    this.ports = [];
    this.sprite = new Sprite(resources['images/singo.png'].texture);
    this.setSprite();
    this.ports.push(Port.DOUBLE, Port.DOUBLE, Port.CLOSED);
}
Singo.prototype = new Piece();
Singo.prototype.activate = function () {
    this.sprite.setTexture(resources['images/singo-active.png'].texture);
};
Singo.prototype.deactivate = function () {
    this.sprite.setTexture(resources['images/singo.png'].texture);
};

function Trigo() {
    this.ports = [];
    this.sprite = new Sprite(resources['images/trigo.png'].texture);
    this.setSprite();
    this.ports.push(Port.DOUBLE, Port.DOUBLE, Port.DOUBLE);
}
Trigo.prototype = new Piece();
Trigo.prototype.activate = function () {
    this.sprite.setTexture(resources['images/trigo-active.png'].texture);
};
Trigo.prototype.deactivate = function () {
    this.sprite.setTexture(resources['images/trigo.png'].texture);
};

function Oneway() {
    this.ports = [];
    this.sprite = new Sprite(resources['images/oneway.png'].texture);
    this.setSprite();
    this.ports.push(Port.OUT, Port.OUT, Port.DOUBLE);
}
Oneway.prototype = new Piece();
Oneway.prototype.activate = function () {
    this.sprite.setTexture(resources['images/oneway-active.png'].texture);
};
Oneway.prototype.deactivate = function () {
    this.sprite.setTexture(resources['images/oneway.png'].texture);
};

// 可通过 instanceof Destroy 判断实例
function Destroy() {
    this.sprite = new Sprite(resources['images/destroy.png'].texture);
    this.setSprite();
}
Destroy.prototype = new Piece();

function checkGameOver() {
    for (let i = 0; i < starts.length; i++) {
        if (isRouteFinished(starts[i], starts[i].oppositeEnd)) {
            let block = starts[i].block;
            if (block === 1 || block === 4) {
                players[0].win();
                return 'Player 1 wins'; // todo 测试用，删除
            } else if (block === 2 || block === 5) {
                players[1].win();
                return 'Player 2 wins'; // todo 测试用，删除
            } else if (block === 3 || block === 6) {
                players[2].win();
                return 'Player 3 wins'; // todo 测试用，删除
            }
        }
    }
    return 'Game is not over'; // todo 测试用，删除
}

function isRouteFinished(location, end) {
    for (let i = 0; i < location.to.length; i++) {
        if (isRouteFinishedHelper(location, location, location.to[i], end)) {
            return true;
        }
    }
    return false;
}

function isRouteFinishedHelper(start, from, location, end) {
    if (location !== start) {
        if (location === end) {
            return true;
        } else {
            for (let i = 0; i < location.to.length; i++) {
                if (location.to[i] !== from) {
                    if (isRouteFinishedHelper(start, location, location.to[i], end)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

// activate所有与顶点链接的棋子，deactivate剩余
function activateRoutes() {
    let activePieces = new Set();
    for (let i = 0; i < starts.length; i++) {
        activePieces.add(starts[i].piece);
        for (let j = 0; j < starts[i].to.length; j++) {
            activateRoutesHelper(starts[i], starts[i], starts[i].to[j], activePieces);
        }
    }
    for (let i = 0; i < pieces.length; i++) {
        if (activePieces.has(pieces[i])) {
            pieces[i].activate();
        } else {
            pieces[i].deactivate();
        }
    }
}

function activateRoutesHelper(start, from, location, activePieces) {
    if (location !== start) { // 防止绕回来
        activePieces.add(location.piece);
        for (let i = 0; i < location.to.length; i++) {
            if (location.to[i] !== from) {
                activateRoutesHelper(start, location, location.to[i], activePieces);
            }
        }
    }
}

function updateConnection(piece) {
    for (let i = 0; i < pieces.length; i++) {
        connect(piece, pieces[i]);
    }
}

function connect(piece1, piece2) {
    if (piece1 !== piece2) {
        if (isConnetable(piece1, piece2)) {
            piece1.location.to.push(piece2.location);
            piece2.location.from.push(piece1.location);
        }
        if (isConnetable(piece2, piece1)) {
            piece2.location.to.push(piece1.location);
            piece1.location.from.push(piece2.location);
        }
    }
}

function isConnetable(piece1, piece2) {
    let location1 = piece1.location,
        location2 = piece2.location;
    if (location1.block === location2.block) {
        if (location1.section === location2.section) {
            if (location1.row === location2.row) {
                if (location1.column - location2.column === 1) {
                    if (location1.up) {
                        return piece1.ports[0] !== Port.CLOSED && piece2.ports[0] === Port.DOUBLE;
                    } else {
                        return piece1.ports[1] !== Port.CLOSED && piece2.ports[1] === Port.DOUBLE;
                    }
                } else if (location2.column - location1.column === 1) {
                    if (location1.up) {
                        return piece1.ports[1] !== Port.CLOSED && piece2.ports[1] === Port.DOUBLE;
                    } else {
                        return piece1.ports[0] !== Port.CLOSED && piece2.ports[0] === Port.DOUBLE;
                    }
                }
            } else if (piece1.ports[2] !== Port.CLOSED && piece2.ports[2] === Port.DOUBLE) {
                if (location1.column % 2 === 1) {
                    return location2.row === location1.row + 1 && location2.column === location1.column + 1;
                } else if (location1.column % 2 === 0) {
                    return location2.row === location1.row - 1 && location2.column === location1.column - 1;
                }
            }
        } else if (location1.row === 3 && location2.row === 3 && location1.column % 2 === 1 && location1.column + location2.column === 6) {
            return piece1.ports[2] !== Port.CLOSED && piece2.ports[2] === Port.DOUBLE;
        }
    } else if (location1.section === 2 && location2.section === 2  && location1.row === location2.row) {
        if (location1.block - location2.block === 1 || location1.block - location2.block === -5) {
            if (piece1.ports[1] !== Port.CLOSED && piece2.ports[0] === Port.DOUBLE) {
                return location1.column === location1.row * 2 - 1 && location2.column === 1;
            }
        } else if (location1.block - location2.block === -1 || location1.block - location2.block === 5) {
            if (piece1.ports[0] !== Port.CLOSED && piece2.ports[1] === Port.DOUBLE) {
                return  location1.column === 1 && location2.column === location2.row * 2 - 1;
            }
        }
    }
    return false;
}

// todo 优化Player
function Player(id) {
    this.id = id;
    let color;
    switch (id) {
        case 1:
            color = 0xcaecff;
            break;
        case 2:
            color = 0xf7d7ff;
            break;
        case 3:
            color = 0xfffccc;
    }
    this.sprite = new PIXI.Text(
        'Player' + id,
        {font: '24px impact', fill: color}
    );
    this.pieces = [];
    this.offsetY = 50 + id * 100;
}
Player.prototype = {
    initialize: function () {
        this.sprite.position.set(10, this.offsetY);
        stage.addChild(this.sprite);
        for (let i = 0; i < 3; i++) {
            let piece = randomPiece();
            piece.player = this;
            this.pieces.push(piece);
        }
        this.printPieces();
    },

    win: function () {
        alert('Player' + this.id + ' Wins');

        // let text = new PIXI.Text(
        //     'Player' + this.id + ' Wins!',
        //     {font: '48px impact'}
        // );
        // text.x = renderer.view.width / 2 - text.width / 2;
        // text.y = renderer.view.height / 2 -text.height / 2;
        // winStage.addChild(text);
        // state = winState;
    },

    printPieces: function () {
        for (let i = 0; i < 3; i++) {
            let piece = this.pieces[i];
            piece.sprite.position.set(50 + 70 * i, this.offsetY + 70);

            // todo piece旋转复原
            piece.rotation = 1; // 逻辑旋转复原
            piece.sprite.rotation = 0; // GUI旋转复原
            stage.addChild(piece.sprite);
        }
    }
};

function randomPiece () {
    let random = randomInt(1, 100);
    if (random < 40) {
        return new Singo();
    } else if (random < 70) {
        return new Trigo();
    } else if (random < 90) {
        return new Oneway();
    } else {
        return new Destroy();
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}