var mongodb = require('mongodb'),
    io = require('socket.io'),
    uuid = require('node-uuid'),
    Mongo = mongodb.MongoClient,
    ObjectID = mongodb.ObjectID,
    Base62 = require("base62"),
    Jax = require('./Jax').Jax;

var games = [];
var activeGames = {};
var port = 9000;
var app = {
    // event name constants
    EVENTS: {

    },
    port: 9000,
    mongoConfig: {
        native_parser: true,
        db: {
            w: 0
        }
    }
}

Mongo.connect("mongodb://localhost:27017/jax", app.mongoConfig, function (err, db) {

    app.mongo = db;
    app.manager = io.listen(app.port, {log: false});
    app.games = db.collection('games');
    app.counters = db.collection('counters');

    app.games.find({status: {$ne: 'COMPLETED'}}).toArray(function (err, games) {

        if (!err) {
            games.forEach(function (game) {

                console.log('Creating game channel ' + game.channel)
                createGameChannel(game);
            })
        }
    })

    app.manager.sockets.on('connection', function (socket) {

        socket.on('find-opponent', function (name) {

            app.games.findOne({status: 'WAITING_FOR_PLAYERS'}, function (err, game) {

                if (game) {
                    socket.emit('found-game', game.channel);
                } else {
                    createGame(socket);
                }
            });
        });
    });

    function createGameChannel(game) {

        app.manager.of("/" + game.channel).on('connection', function (socket) {

            console.log('Game connection established!');

            var playerIndex, player;

            socket.on('rejoin', function (index) {

                playerIndex = index;
                player = game.players[index];

                console.log(player.name + " rejoined game channel " + game.channel);

                socket.emit('joined', game.boardName, playerIndex);
                socket.broadcast.emit('opponent-rejoined', player.name, playerIndex);

                if (game.status == 'WAITING_FOR_PLAYERS') {
                    if (game.playerCnt != 2) {
                        socket.emit('waiting-for-players');
                    }
                } else {
                    socket.emit('game-in-progress', {
                        boardName: game.boardName,
                        cards: player.cards,
                        cellStates: game.cellStates,
                        discarded: game.discarded.slice(0, 4),
                        canPlay: player.canPlay,
                        gameStartedDtm: new Date()
                    })
                }
            });

            // begin event handler registration
            socket.on('join', function (name) {
                console.log(name + " joined game channel " + game.channel);

                playerIndex = game.playerCnt;
                player = game.players[playerIndex] = {
                    flag: Jax.PLAYER_FLAGS[playerIndex],
                    name: name,
                    sessionId: '',
                    cards: [],
                    canPlay: false
                }

                socket.emit('joined', game.boardName, playerIndex);
                socket.broadcast.emit('opponent-joined', name, playerIndex);
                game.playerCnt++;

                var update = {
                    $set: {
                        playerCnt: game.playerCnt
                    }
                };
                update.$set["players." + playerIndex] = player;
                app.games.update({_id: game._id}, update)

                if (game.playerCnt == 2) {

                    console.log('Starting game: ' + game.channel);

                    var p1Cards = game.players[0].cards;
                    var p2Cards = game.players[1].cards;
                    for (i = 0; i < 7; i++) {
                        p1Cards.push(game.deck.pop());
                        p2Cards.push(game.deck.pop());
                    }

                    app.games.update(
                        {_id: game._id},
                        {
                            $set: {
                                status: 'IN_PROGRESS',
                                "players.0.canPlay": true,
                                "players.0.cards": p1Cards,
                                "players.1.cards": p2Cards
                            }
                        }
                    )
                    socket.broadcast.emit('start-game', game.boardName, p1Cards);
                    socket.emit('start-game', game.boardName, p2Cards);
                    game.players[0].canPlay = true;
                    socket.broadcast.emit('take-turn');
                } else {
                    socket.emit('waiting-for-players');
                }
            });

            socket.on('play', function (cellIndex, cardIndex) {
                console.log("attempting to play card " + cardIndex + " in cell " + cellIndex);

                var drawnCard,
                    card = player.cards[cardIndex];

                if (playCard(cellIndex, cardIndex, player, game)) {

                    var drawnCard = game.deck.pop();
                    player.cards.splice(cardIndex, 1, drawnCard);
                    game.discarded.unshift(card);
                    socket.emit('play-accepted', playerIndex, cellIndex, card);
                    socket.broadcast.emit('play-accepted', playerIndex, cellIndex, card);

                    if (Jax.isSeq(cellIndex, game.cellStates)) {
                        var update =  {
                            completedDtm: new Date(),
                            winner: playerIndex,
                            status: 'COMPLETED'
                        };
                        update['players.' + playerIndex + '.canPlay'] = false;
                        app.games.update({_id: game._id}, {$set: update});

                        socket.emit('winner');
                        socket.broadcast.emit('loser');

                    } else {
                        player.canPlay = false;
                        game.players[(+playerIndex + 1) % 2].canPlay = true;
                        var update = {
                            discarded: game.discarded,
                            deck: game.deck,
                            cellStates: game.cellStates,
                            lastPlayDtm: new Date()
                        }
                        update['players.' + playerIndex + '.cards'] = player.cards;
                        update['players.' + playerIndex + '.canPlay'] = false;
                        update['players.' + ((+playerIndex + 1) % 2) + '.canPlay'] = true;
                        app.games.update({_id: game._id}, {$set: update});

                        socket.broadcast.emit('take-turn');
                        socket.emit('card-drawn', drawnCard, cardIndex);
                    }
                } else {
                    socket.emit('invalid-play');
                }
            });

            socket.on('discard-card', function (cardIndex) {

                var discardedCard = player.cards[cardIndex];

                if (canDiscard(discardedCard, game)) {
                    var drawnCard = game.deck.pop();

                    console.log(player.name + " discarded " + discardedCard);

                    game.discarded.unshift(discardedCard);
                    player.cards.splice(cardIndex, 1, drawnCard);

                    var update = {
                        discarded: game.discarded,
                        deck: game.deck,
                        lastPlayDtm: new Date()
                    }
                    update['players.' + playerIndex + '.cards'] = player.cards;
                    app.games.update({_id: game._id}, {$set: update})

                    socket.emit('card-drawn', drawnCard, cardIndex);
                    socket.emit('card-discarded', discardedCard);
                    socket.broadcast.emit('card-discarded', discardedCard);
                } else {
                    socket.emit('invalid-play')
                }
            });

            socket.emit('')
        });

        app.manager.of("/" + game.channel).on('disconnect', function () {

            console.log('player disconnected')
        });
    }

    function createGame(socket) {


        app.counters.findAndModify({type: 'game'}, [], {$inc: {count: 1}}, {upsert: true}, function (err, counter) {


            var boardName = ['sequence', 'oneEyedJack', 'custom1'][new Date().getTime() % 3];
            app.games.save({
                channel: Base62.encode(counter.count),
                status: 'WAITING_FOR_PLAYERS',
                inProgress: false,
                boardName: boardName,
                boardCells: Jax.BOARDS[boardName],
                maxPlayers: 2,
                playerCnt: 0,
                deck: Jax.shuffleDecks(),
                discarded: [],
                cellStates: Jax.initCellStates(Jax.BOARDS[boardName]),
                players: [],
                createdDtm: new Date()
            }, function (err, game) {
                if (err) {
                    console.error(err);
                }

                createGameChannel(game);

                socket.emit('found-game', game.channel);
            })
        })
    }


    function playCard(cellIndex, playersCardIndex, player, game) {

        var playersCard = player.cards[playersCardIndex],
            cellCard = game.boardCells[cellIndex],
            cellStates = game.cellStates,
            playersTurn = player.canPlay,
            cardMatchesCell = (Jax.isOpen(cellIndex, cellStates) && (playersCard == cellCard || Jax.isBlackJack(playersCard))),
            isJackable = (Jax.isRedJack(playersCard) && Jax.isOccupied(cellIndex, cellStates) && !Jax.isOccupiedBy(cellIndex, player.flag, game, cellStates)),
        // could be optimized to skip all this processing its not the users turn.
            isValidPlay = (playersTurn && (cardMatchesCell || isJackable));

        if (isValidPlay && isJackable) {
            cellStates[cellIndex] = Jax.OPEN_FLAG;
        } else if (isValidPlay) {
            cellStates[cellIndex] = player.flag;
        }

        return isValidPlay;
    }

    function canDiscard(card, game) {

        var firstIndex = game.boardCells.indexOf(card),
            lastIndex = game.boardCells.lastIndexOf(card)

        return !(Jax.JOKER == card ||
            Jax.isJack(card) ||
            Jax.isOpen(firstIndex, game.cellStates) ||
            Jax.isOpen(lastIndex, game.cellStates));
    }
});
