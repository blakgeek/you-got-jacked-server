var io = require('socket.io').listen(9000, {log: false}),
    uuid = require('node-uuid');

var games = [];
var activeGames = {};

io.sockets.on('connection', function (socket) {

    socket.on('find-opponent', function (name) {

        socket.set('name', name);

        var game = games.pop();
        if (game) {
            console.log("found game: " + game.id);
            socket.emit('found-game', game.id);
        } else {
            var gameId = uuid();
            console.log("new game created: " + gameId);
            game = {
                id: gameId,
                player1: name
            };
            createGame(gameId);
            games.push(game);
            socket.emit('waiting', gameId);
        }

    });
});



function createGame(gameId) {

    activeGames[gameId] = activeGames[gameId] || {
        boardName: 'custom1',
        boardCells: [],
        maxPlayers: 2,
        playerCnt: 0,
        deck: [],
        discarded: [],
        cellState: [],
        players: []
    };
    var game = activeGames[gameId];

    io.of("/" + gameId).on('connection', function (socket) {
        console.log('Game connected!');
        var playerIndex, player,
            boardCells = game.boardCells;

        socket.on('join', function (name) {
            console.log(name + " joined " + gameId);

            socket.broadcast.emit('opponent-joined', name);
            playerIndex = game.playerCnt;
            player = game.players[playerIndex] = {
                sessionId: '',
                cards: [],
                canPlay: false
            }
            game.playerCnt++;
            if (game.playerCnt == 2) {

                console.log('Starting game: ' + gameId)
                socket.broadcast.emit('start-game', game);
                socket.emit('start-game', game);
            }
        });

        socket.on('play', function (cellIndex, cardIndex) {
            console.log("played in cell: " + cellIndex);

            var drawnCard,
                card = player.cards[cardIndex];

            // TODO: validate that the card at cardIndex is valid to be played on cellIndex
            if (isValidPlay) {
                socket.emit('invalid-play');
            } else {
                socket.emit('play-accepted');
                socket.emit('drawnCard-drawn', drawnCard);
                socket.broadcast.emit('opponent-played', playerIndex, cellIndex, card);
                socket.broadcast.emit('take-turn');
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
}

function isValidPlay(playersCardIndex, cellIndex) {

    var playersCard = hand[playerCardIndex],
        cellCard = boardCells[cellIndex],
        cardMatchesCell = (isOpen(cellIndex) && (playersCard == cellCard || isBlackJack(card))),
        isJackable = (isRedJack(card) && isOccupied(cellIndex) && isOccupiedBy(cellIndex, playerConst));

    return (cardMatchesCell || isJackable);
}
