"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var player_1 = require("./player");
var signal_1 = require("../enums/signal");
var MIID = 0;
var Match = /** @class */ (function () {
    function Match(level) {
        this.level = 0;
        this.players = [];
        this.time = 400;
        this.letters = null;
        this.running = false;
        this.red_pid = 0;
        this.blue_pid = 0;
        this.score = {};
        this.level = level;
        var counts = [39, 61];
        var ids = [];
        for (var i = 0; i < counts[level]; i++) {
            ids.push(i);
        }
    }
    Match.getMatch = function () {
        if (Match.pendingMatches.length > 0) {
            return Match.pendingMatches.pop();
        }
        else {
            var match = new Match(1);
            Match.pendingMatches.push(match);
            return match;
        }
    };
    Match.prototype.broadcast = function (signal, data) {
        var totalPlayers = this.players.length;
        for (var i = totalPlayers - 1; i >= 0; i--) {
            var player = this.players[i];
            if (player) {
                player.send(signal, data);
                for (var key in player_1.default.players) {
                    var player_2 = player_1.default.players[key];
                    if (player_2) {
                        player_2.send(signal, data);
                    }
                }
            }
        }
    };
    Match.prototype.broadcastExclude = function (exclude_player, signal, data) {
        var totalPlayers = this.players.length;
        for (var i = totalPlayers - 1; i >= 0; i--) {
            var player = this.players[i];
            if (exclude_player.uuid == player.uuid) {
                continue;
            }
            if (player) {
                for (var key in player_1.default.players) {
                    var player_3 = player_1.default.players[key];
                    if (player_3.uuid != exclude_player.uuid) {
                        console.log("broadcastExclude", player_3.uuid, exclude_player.uuid);
                        player_3.send(signal, data);
                    }
                }
            }
        }
    };
    Match.prototype.broadcastExcept = function (excludedPlayer, signal, data) {
        var totalPlayers = this.players.length;
        for (var i = totalPlayers - 1; i >= 0; i--) {
            var player = this.players[i];
            if (player !== excludedPlayer) {
                player.send(signal, data);
            }
        }
    };
    Match.prototype.start = function () {
        var _this = this;
        this.running = true;
        // shuffle the players array
        this.players.sort(function () { return Math.random() - 0.5; });
        this.broadcast(signal_1.default.MATCH, {
            level: this.level,
            time: this.time,
            blue_id: this.players[0].uuid,
            red_id: this.players[1].uuid,
        });
        setTimeout(function () {
            _this.timeup();
        }, this.time * 1000);
        this.close();
    };
    Match.prototype.stop = function () {
        var _this = this;
        this.running = false;
        this.broadcast(signal_1.default.RESULT, { interrupted: this.players.length < 2 });
        this.close();
        this.players.forEach(function (player) {
            _this.leave(player, true);
        });
    };
    Match.prototype.timeup = function () {
        if (this.running) {
            this.stop();
        }
    };
    Match.prototype.join = function (player) {
        if (this.players.length >= 2 || this.players.indexOf(player) >= 0) {
            return;
        }
        this.players.push(player);
        player.match = this;
        this.broadcast(signal_1.default.JOIN, {
            uuid: player.uuid
        });
        this.score[player.uuid] = {
            score: 0
        };
        if (this.players.length >= 2) {
            this.start();
        }
    };
    Match.prototype.leave = function (player, silence) {
        if (this.players.indexOf(player) < 0) {
            return;
        }
        player.match = null;
        this.players.splice(this.players.indexOf(player), 1);
        if (!silence) {
            this.broadcast(signal_1.default.LEAVE, { uuid: player.uuid });
        }
        if (this.running) {
            this.stop();
        }
        this.close();
    };
    Match.prototype.close = function () {
        if (Match.pendingMatches.indexOf(this) >= 0) {
            Match.pendingMatches.splice(Match.pendingMatches.indexOf(this), 1);
        }
    };
    Match.pendingMatches = [];
    return Match;
}());
exports.default = Match;
