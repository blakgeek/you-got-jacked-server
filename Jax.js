var Jax = {

    OPEN_FLAG: 1,
    P1_FLAG: 2,
    P2_FLAG: 4,
    P3_FLAG: 8,
    LOCKED_H: 16,
    LOCKED_V: 32,
    LOCKED_DL: 64,
    LOCKED_DR: 128,
    PLAYER_FLAGS: [2, 4, 8],
    DIAMOND: 0,
    HEART: 13,
    CLUB: 26,
    SPADE: 39,
    JOKER: 52,
    JACK_DIAMOND: 10,
    JACK_HEART: 23,
    JACK_CLUB: 36,
    JACK_SPADE: 49,
    CAPTURE_FACTOR: 6,
    IN_HAND_FACTOR: 4,
    BLOCKER_FACTOR: 1 / (6 * 6),
    SEQUENCE_BOARD: [],
    CLASSIC_BOARD: [],
    SUITS: ['DIAMOND', 'HEART', 'CLUB', 'SPADE'],
    DECKS: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 52, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 52],
    CARDS: ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'],

    cardToCells: [],
    cellScores: [],
    cellVals: [],
    cellStates: [],
    cellCards: [],
    players: [],
    discardPile: [],

    init: function () {

        this.BOARDS = {
            sequence: this.readBoard([
                'jj', '6d', '7d', '8d', '9d', '10d', 'qd', 'kd', 'ad', 'jj',
                '5d', '3h', '2h', '2s', '3s', '4s', '5s', '6s', '7s', 'ac',
                '4d', '4h', 'kd', 'ad', 'ac', 'kc', 'qc', '10c', '8s', 'kc',
                '3d', '5h', 'qd', 'qh', '10h', '9h', '8h', '9c', '9s', 'qc',
                '2d', '6h', '10d', 'kh', '3h', '2h', '7h', '8c', '10s', '10c',
                'as', '7h', '9d', 'ah', '4h', '5h', '6h', '7c', 'qs', '9c',
                'ks', '8h', '8d', '2c', '3c', '4c', '5c', '6c', 'ks', '8c',
                'qs', '9h', '7d', '6d', '5d', '4d', '3d', '2d', 'as', '7c',
                '10s', '10h', 'qh', 'kh', 'ah', '2c', '3c', '4c', '5c', '6c',
                'jj', '9s', '8s', '7s', '6s', '5s', '4s', '3s', '2s', 'jj'
            ]),
            oneEyedJack: this.readBoard(
                "jj 10d 9d 8d 7d 7s 8s 9s 10s jj\
                10c kc 6d 5d 4d 4s 5s 6s kh 10h\
                9c 5c qc 3d 2d 2s 3s qh 6h 9h \
                8c 6c 3c qd ad as qs 3h 5h 8h\
                7c 4c 2c ac kd ks ah 2h 4h 7h\
                7h 4h 2h ah ks kd ac 2c 4c 7c\
                8h 5h 3h qs as ad qd 2c 5c 8c\
                9h 6h qh 3s 2s 2d 3d qc 5c 9c\
                10h kh 6s 5s 4s 4d 5d 6d kc 10c\
                jj 10s 9s 8s 7s 7d 8d 9d 10d jj"
            ),
            custom1: this.readBoard([
                'kh', 'qh', '10h', '9h', '8h', '7h', '6h', '5h', '4h', 'ks',
                '4c', '3c', '2c', '6s', '7s', '8s', '9s', '10s', '3h', 'qs',
                '5c', '10h', 'qh', '5s', 'jj', 'as', 'ks', 'qs', '2h', '10s',
                '6c', '9h', 'kh', '4s', '2d', '3d', '4d', '5d', '6d', '9s',
                '7c', '8h', 'ah', '3s', 'ac', 'ah', '2c', 'jj', '7d', '8s',
                '8c', '7h', 'jj', '2s', 'ad', 'as', '3c', 'ad', '8d', '7s',
                '9c', '6h', '5h', '4h', '3h', '2h', '4c', 'kd', '9d', '6s',
                '10c', '2d', 'qc', 'kc', 'ac', 'jj', '5c', 'qd', '10d', '5s',
                'qc', '3d', '10c', '9c', '8c', '7c', '6c', '2s', '3s', '4s',
                'kc', '4d', '5d', '6d', '7d', '8d', '9d', '10d', 'qd', 'kd'
            ])
        }
    },

    initCellStates: function (boardCells) {

        var cellStates = [];

        for (var i = 0; i < 100; i++) {

            var card = boardCells[i];

            if (card != Jax.JOKER) {
                cellStates[i] = Jax.OPEN_FLAG;
            } else {
                cellStates[i] = Jax.P1_FLAG | Jax.P2_FLAG | Jax.P3_FLAG | Jax.OPEN_FLAG;
            }
        }

        return cellStates;
    },

    newGame: function (boardName) {

        var board = this.BOARDS[boardName || 'sequence'];
        this.cardToCells[Jax.JACK_SPADE] = this.cardToCells[Jax.JACK_CLUB] = [
            1, 2, 3, 4, 5, 6, 7, 8,
            10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
            20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
            30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
            40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
            50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
            60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
            70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
            80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
            91, 92, 93, 94, 95, 96, 97, 98
        ];

        this.cardToCells[Jax.JACK_HEART] = this.cardToCells[Jax.JACK_SPADE] = [];

        var html = [];


        $('#board').html(html.join(''));

        Jax.cells = $('#board li');

        Jax.gameDeck = Jax.shuffleDecks();

        Jax.numPlayers = 2;
        Jax.players = [];
        for (var i = 0; i < Jax.numPlayers; i++) {
            Jax.players.push({
                cards: [],
                jackableCells: []
            });
        }

        for (var i = 0; i < 7; i++) {
            for (var k = 0; k < Jax.numPlayers; k++) {
                Jax.players[k].cards.push(Jax.gameDeck.pop());
            }
        }

        Jax.cells.click(function () {

            var cell = $(this),
                cellIndex = cell.attr('data-cell'),
                card = cell.attr('data-value'),
                activeCard = Jax.myActiveCard;

            if (activeCard) {

                if ((Jax.isOpen(cellIndex) && (card == activeCard.value || Jax.isBlackJack(activeCard.value))) ||
                    (Jax.isRedJack(activeCard.value) && Jax.isOccupied(cellIndex) && !Jax.isOccupiedBy(cellIndex, Jax.P1_FLAG))) {

                    if (playCard(0, cellIndex, activeCard.index) == false) {
                        autoPlay(1);
                        delete Jax.myActiveCard;
                    }
                }
            }
        });

        $('#player1').on('click', 'li', this.selectCard);
        displayHand();
    },

    gameOver: function (winner) {

        $('#dialog p').html(winner == 0 ? "You win!" : "You just got whooped by a computer.");
        $('#dialog').css('z-index', 10000).show();
        $('#player1').unbind('click', this.selectCard);
    },

    selectCard: function () {

        $('#player1 li').removeClass('active');
        $(this).addClass('active');
        Jax.myActiveCard = {
            index: $(this).attr('data-pos'),
            value: $(this).attr('data-value')
        };
    },

    readBoard: function (board) {

        board = board instanceof Array ? board : board.split(/\s+/);

        var suitMultipliers = {
            'd': 0,
            'h': 1,
            'c': 2,
            's': 3,
            'j': 0
        }

        var cardVals = {
            'a': 0,
            '2': 1,
            '3': 2,
            '4': 3,
            '5': 4,
            '6': 5,
            '7': 6,
            '8': 7,
            '9': 8,
            '10': 9,
            'q': 11,
            'k': 12,
            'j': 52
        }

        return board.map(function (cell) {

            return cardVals[cell.slice(0, -1)] + (13 * suitMultipliers[cell.substr(-1)]);
        })
    },

    shuffleDecks: function () {

        var a = [].concat(Jax.DECKS);
        for (var i = a.length - 1; i; i--) {
            var j = parseInt(Math.random() * i);
            var tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }

        return a;
    },

    cellify: function (index) {

        var row = Math.floor(index / 10),
            col = index % 10,
            top = Math.min(row, 4),
            bottom = Math.min(9 - row, 4),
            left = Math.min(col, 4),
            right = Math.min(9 - col, 4);

        return {
            tc: index - (top * 10),
            bc: index + (bottom * 10),
            cl: index - left,
            cr: index + right,
            tl: ((row - Math.min(top, left)) * 10) + (col - Math.min(top, left)),
            tr: ((row - Math.min(top, right)) * 10) + (col + Math.min(top, right)),
            br: ((row + Math.min(bottom, right)) * 10) + (col + Math.min(bottom, right)),
            bl: ((row + Math.min(bottom, left)) * 10) + (col - Math.min(bottom, left))
        };
    },

    isDeadCard: function (card, cellStates) {

        var cells = (cellStates || Jax.cellStates)[card],
            result = true;

        if (this.isJack(card)) {
            result = false;
        } else {

            for (var i = 0; i < cells.length; i++) {

                if (!this.isOccupied(cells[i])) {

                    result = false;
                    break;
                }
            }
        }

        return result;
    },

    isOpen: function (index, cellStates) {

        return !Jax.isOccupied(index, cellStates);
    },

    isOccupied: function (index, cellStates) {

        return !((cellStates || Jax.cellStates)[index] & Jax.OPEN_FLAG);
    },

    isLockedH: function (index, cellStates) {
        return !!((cellStates || Jax.cellStates)[index] & Jax.LOCKED_H);
    },

    isLockedV: function (index, cellStates) {
        return !!((cellStates || Jax.cellStates)[index] & Jax.LOCKED_V);
    },

    isLockedDL: function (index, cellStates) {
        return !!((cellStates || Jax.cellStates)[index] & Jax.LOCKED_DL);
    },

    isLockedDR: function (index, cellStates) {
        return !!((cellStates || Jax.cellStates)[index] & Jax.LOCKED_DR);
    },

    isOccupiedBy: function (index, player, cellStates) {

        return !!((cellStates || Jax.cellStates)[index] & player);
    },

    isRedJack: function (card) {

        return (Jax.isJack(card) && card < 26);
    },

    isBlackJack: function (card) {

        return (Jax.isJack(card) && card > 26);
    },

    isJack: function (card) {
        return (card % 13 == 10);
    },

    score: function (cellIndex, playerIndex, scoreCaptured) {

        if (!scoreCaptured && Jax.isOccupied(cellIndex)) {
            return 0;
        }

        var cell = Jax.cellify(cellIndex),
            multiplier = Jax.multiplier(cellIndex, playerIndex),
            h = cell.cr - cell.cl,
            v = (cell.bc - cell.tc) / 10,
            dl = (cell.br - cell.tl) / 11,
            dr = (cell.bl - cell.tr) / 9,
            baseScore = h + v + dl + dr;

        return  baseScore * multiplier;
    },

    multiplier: function (cellIndex, playerIndex) {
        return (Jax.calcHMultiplier(cellIndex, playerIndex) +
            Jax.calcVMultiplier(cellIndex, playerIndex) +
            Jax.calcDRMultiplier(cellIndex, playerIndex) +
            Jax.calcDLMultiplier(cellIndex, playerIndex)) || 1;
    },

    isSeq: function (index, player, cellStates) {

        return Jax.isHSeq(index, player, cellStates) || Jax.isVSeq(index, player, cellStates) ||
            Jax.isDLSeq(index, player, cellStates) || Jax.isDRSeq(index, player, cellStates);
    },

    ias: function (index, player, start, end, increment, cellStates) {

        var isSeq = false;

        if (end - start >= 4 * increment) {

            for (var i = start; i <= end - (increment * 4); i += increment) {

                var matchCnt = 0;
                var lockCnt = 0;

                for (var k = i; k <= i + increment + 4; k++) {
                    if (Jax.isOccupiedBy(k, player, cellStates)) {
                        matchCnt++;
                        if (Jax.isLockedH(k, cellStates)) {
                            lockCnt++;
                        }
                    } else {
                        break;
                    }
                }

                if ((lockCnt == 0 && matchCnt >= 5) || matchCnt == 10) {
                    isSeq = true;
                    break;
                }
            }
        }

        return isSeq;
    },
    isHSeq: function (index, player, cellStates) {

        var cell = Jax.cellify(index),
            start = cell.cl,
            end = cell.cr;

        return this.ias(index, player, start, end, 1, cellStates);
    },

    isVSeq: function (index, player, cellStates) {

        var cell = Jax.cellify(index),
            start = cell.tc,
            end = cell.bc;

        return this.ias(index, player, start, end, 10, cellStates);
    },

    isDLSeq: function (index, player, cellStates) {

        var cell = Jax.cellify(index),
            start = cell.tl,
            end = cell.br;

        return this.ias(index, player, start, end, 11, cellStates);
    },

    isDRSeq: function (index, player, cellStates) {
        var cell = Jax.cellify(index),
            start = cell.tr,
            end = cell.bl;

        return this.ias(index, player, start, end, 9, cellStates);
    },

    isCardInHand: function (card, playerIndex) {

        var cards = Jax.players[playerIndex].cards;

        return (cards.indexOf(card) != -1);
    },

    gmc: function (start, end, increment, playerIndex) {

        var player = Jax.PLAYER_FLAGS[playerIndex],
            multiplier = 0;

        if (end - start >= 4 * increment) {

            for (var i = start; i <= end - (increment * 4); i += increment) {

                var captureCnt = 0;
                var blockerCnt = 0;
                var inHandCnt = 0;
                // test 5 contiguous cells for captureCnt
                for (var k = i; k <= i + increment + 4; k++) {

                    if (Jax.isOccupiedBy(k, player)) {
                        captureCnt++;
                    } else if (Jax.isOccupied(k)) {
                        blockerCnt++;
                    } else if (Jax.isCardInHand(Jax.cellCards[k], playerIndex)) {
                        inHandCnt++;
                    }
                }
                if (captureCnt > 0) {
                    multiplier += Math.pow(Jax.CAPTURE_FACTOR, captureCnt) * Math.pow(Jax.BLOCKER_FACTOR, blockerCnt) + Math.pow(Jax.IN_HAND_FACTOR, inHandCnt);
                }
            }
        }
        return multiplier;

    },

    calcHMultiplier: function (cellIndex, playerIndex) {

        var cell = Jax.cellify(cellIndex),
            start = cell.cl,
            end = cell.cr;

        return this.gmc(start, end, 1, playerIndex)
    },

    calcVMultiplier: function (cellIndex, playerIndex) {

        var cell = Jax.cellify(cellIndex),
            start = cell.tc,
            end = cell.bc;

        return this.gmc(start, end, 10, playerIndex)
    },

    calcDLMultiplier: function (cellIndex, playerIndex) {

        var cell = Jax.cellify(cellIndex),
            start = cell.tl,
            end = cell.br;

        return this.gmc(start, end, 11, playerIndex)
    },

    calcDRMultiplier: function (cellIndex, playerIndex) {

        var cell = Jax.cellify(cellIndex),
            start = cell.tr,
            end = cell.bl;

        return this.gmc(start, end, 9, playerIndex)
    }
};

Jax.init();
exports.Jax = Jax;
