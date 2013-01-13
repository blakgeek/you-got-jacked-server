var io = require('socket.io').listen(9000, {log: false}),
    uuid = require('node-uuid'),
    Jax = require('./Jax').Jax;

var games = [];
var activeGames = {};

io.sockets.on('connection', function (socket) {

    socket.on('find-opponent', function (name) {

        var game = games.pop();

        if (!game) {
            var gameId = uuid();
            console.log("Creating new game: " + gameId);
            game = {
                id: gameId,
                player1: name
            };
            createGame(gameId);
            games.push(game);
        }

        socket.emit('found-game', game.id);

    });
});



function createGame(gameId) {

    var boardName = ['sequence', 'oneEyedJack', 'custom1'][new Date().getTime()%3],
        boardCells = Jax.BOARDS[boardName];

    var game = activeGames[gameId] = activeGames[gameId] || {
        inProgress: false,
        boardName: boardName,
        boardCells: boardCells,
        maxPlayers: 2,
        playerCnt: 0,
        deck: Jax.shuffleDecks(),
        discarded: [],
        cellStates: Jax.initCellStates(boardCells),
        players: []
    };

    io.of("/" + gameId).on('connection', function (socket) {

        console.log('Game connection established!');

        var playerIndex, player;

        socket.on('rejoin', function(index) {

            playerIndex = index;
            player = game.players[index];

            console.log(player.name + " rejoined");

            socket.emit('joined', boardName, playerIndex);
            socket.broadcast.emit('opponent-rejoined', player.name, playerIndex);

            if(!game.inProgress) {
                if (game.playerCnt == 2) {

                    console.log('Starting game: ' + gameId);

                    var p1Cards = game.players[0].cards;
                    var p2Cards = game.players[1].cards;
                    for(i = 0; i<7; i++) {
                        p1Cards.push(game.deck.pop());
                        p2Cards.push(game.deck.pop());
                    }


                    game.inProgress = true;
                    socket.broadcast.emit('start-game', boardName, p1Cards);
                    socket.emit('start-game', boardName, p2Cards);
                    game.players[0].canPlay = true;
                    socket.broadcast.emit('take-turn');
                } else {
                    socket.emit('waiting-for-players');
                }
            } else {
                socket.emit('game-in-progress', {
                    boardName: boardName,
                    cards: player.cards,
                    cellStates: game.cellStates,
                    discarded: game.discarded.slice(0,4),
                    canPlay: player.canPlay
                })
            }
        });

        // begin event handler registration
        socket.on('join', function (name) {
            console.log(name + " joined " + gameId);

            playerIndex = game.playerCnt;
            player = game.players[playerIndex] = {
                flag: Jax.PLAYER_FLAGS[playerIndex],
                name: name,
                sessionId: '',
                cards: [],
                canPlay: false
            }

            socket.emit('joined', boardName, playerIndex);
            socket.broadcast.emit('opponent-joined', name, playerIndex);

            game.playerCnt++;
            if (game.playerCnt == 2) {

                console.log('Starting game: ' + gameId);

                var p1Cards = game.players[0].cards;
                var p2Cards = game.players[1].cards;
                for(i = 0; i<7; i++) {
                    p1Cards.push(game.deck.pop());
                    p2Cards.push(game.deck.pop());
                }

                game.inProgress = true;
                socket.broadcast.emit('start-game', boardName, p1Cards);
                socket.emit('start-game', boardName, p2Cards);
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
                game.discarded.push(drawnCard);
                socket.emit('play-accepted', playerIndex, cellIndex, card);
                socket.broadcast.emit('play-accepted', playerIndex, cellIndex, card);

                if(Jax.isSeq(cellIndex, game.cellStates)) {
                    socket.emit('winner');
                    socket.broadcast.emit('loser');
                } else {
                    socket.emit('card-drawn', drawnCard, cardIndex);
                    player.canPlay = false;
                    game.players[(+playerIndex + 1) % 2].canPlay = true;
                    socket.broadcast.emit('take-turn');
                }
            } else {
                socket.emit('invalid-play');
            }
        });

        socket.on('discard-card', function (handIndex) {
            console.log("play: " + play);
            var discardedCard,
                drawnCard;
            socket.emit('card-drawn', drawnCard)
            socket.broadcast.emit('opponent-discarded-card', discardedCard);
        });
    });

    io.of("/" + gameId).on('disconnect', function() {

        console.log('player disconnected')
        game.playerCnt--;
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

    if(isValidPlay && isJackable) {
        cellStates[cellIndex] = Jax.OPEN_FLAG;
    } else if(isValidPlay) {
        cellStates[cellIndex] = player.flag;
    }

    return isValidPlay;
}
