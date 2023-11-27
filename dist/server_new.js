"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = require("ws");
var express = require("express");
var http = require("http");
var player_1 = require("./entities/player");
var signal_1 = require("./enums/signal");
var events_1 = require("events");
var signal_2 = require("./enums/signal");
var match_1 = require("./entities/match");
var Server = /** @class */ (function () {
    function Server() {
        this.httpServer = null;
        this.wss = null;
        this.config = null;
        this.eventEmitter = new events_1.EventEmitter();
        Server.$ = this;
    }
    Server.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var app;
            return __generator(this, function (_a) {
                console.log('Loading config...');
                console.log('Loading dictionary...');
                if (process.env.PORT) {
                    console.log('Creating http server...');
                    app = express();
                    this.httpServer = http.createServer(app);
                    this.httpServer.listen(process.env.PORT || this.config.port);
                }
                console.log('Setting up ws server...');
                this.setupWebSocket();
                this.bindEvents();
                return [2 /*return*/];
            });
        });
    };
    Server.prototype.bindEvents = function () {
        var _this = this;
        this.eventEmitter.on(signal_2.default.MATCH, function (eventData) { return _this.onRequestMatch(eventData); });
    };
    Server.prototype.onRequestMatch = function (_a) {
        var player = _a.player, data = _a.data;
        var match = match_1.default.getMatch();
        match.join(player);
    };
    Server.prototype.setupWebSocket = function () {
        var _this = this;
        if (process.env.PORT) { // Heroku 
            //@ts-ignore
            this.wss = new ws_1.Server({ server: this.httpServer });
            console.log('\x1b[33m%s\x1b[0m', "Websocket server listening on port ".concat(process.env.PORT || this.config.port, "..."));
            this.wss.on('connection', function (ws) {
                var player = player_1.default.getPlayer(ws);
                _this.onConnection(player);
                ws.on('message', function (message) {
                    _this.onMessage(player, message);
                    var dataTransfer = JSON.parse(Buffer.from(message, 'base64').toString());
                    player.match.broadcastExept(player, signal_2.default.MOVE, { player: player, data: dataTransfer });
                });
                ws.on('close', function (ws) {
                    _this.onClose(player);
                });
            });
        }
        else { //Local
            //@ts-ignore
            this.wss = new ws_1.Server({ port: 8080 }, function () {
                console.log('\x1b[33m%s\x1b[0m', "Websocket server listening on port 8080...");
                _this.wss.on('connection', function (ws) {
                    var player = player_1.default.getPlayer(ws);
                    _this.onConnection(player);
                    ws.on('message', function (message) {
                        _this.onMessage(player, message);
                        console.log(message);
                        var dataTransfer = JSON.parse(Buffer.from(message, 'base64').toString());
                        var signal = dataTransfer['signal'];
                        player.match.broadcastExept(player, signal.MATCH, { player: player, data: dataTransfer });
                        if (signal == '$MY_MOVE') {
                            var data = dataTransfer['data'];
                            var player_id = dataTransfer['player_id'];
                            var player_2 = player_1.default.players[player_id];
                            // player.match.broadcastExept(player, signal.MOVE, {player, data: data})
                        }
                        // else if (signal == signal.MATCH) {
                        // 	player.match.broadcastExept(player, signal.MATCH, {player, data: dataTransfer});
                        // }
                        // // dataTransfer['player_id_sender'] = player.uuid
                        // player.match.broadcastExept(player, signal.MATCH, {player, data: dataTransfer});
                        // for (let p of player.match.players) {
                        // 	console
                        // 	p.send('$PLAYER_SEND' + p.uuid, {player, data: dataTransfer})}
                        // // player.match.broadcastExept(player, signal.MOVE, {player, data: dataTransfer})
                    });
                    ws.on('close', function (ws) {
                        _this.onClose(player);
                    });
                });
            });
        }
    };
    Server.prototype.onConnection = function (player) {
        console.log("Player ".concat(player.uuid, " has connected!"));
        player.send(signal_1.default.UUID, player.uuid);
    };
    Server.prototype.onClose = function (player) {
        player.remove();
        console.log("Player ".concat(player.uuid, " has disconnected!"));
    };
    Server.prototype.onError = function (player, err) {
        console.log("Player ".concat(player.uuid, " has encountered an error!"), err);
    };
    Server.prototype.onMessage = function (player, message) {
        try {
            var data = JSON.parse(Buffer.from(message, 'base64').toString());
            console.log("Player ".concat(player.uuid, ": "), data);
            // this.eventEmitter.emit(data.signal, { player, data });
            // console.log(player.match)
            // console.log(player.match.players, 'players')
            // let dataTransfer = JSON.parse(Buffer.from(message, 'base64').toString())
            // for (let p of player.match.players) {
            // 	p.send('$PLAYER_SEND' + p.uuid, {player, data: dataTransfer})}
            // dataTransfer['player_id_sender'] = player.uuid
            // player.match.broadcast('$PLAYER_SEND', {player, data: dataTransfer})
        }
        catch (ex) {
            console.error(ex);
            console.error("Player ".concat(player.uuid, " unknown package: "), message);
        }
    };
    Server.prototype.send = function (player, signal, message) {
        player.send(signal, message);
    };
    Server.$ = null;
    return Server;
}());
exports.default = Server;
// import WebSocket, { Server as WebSocketServer } from 'ws';
// import * as express from 'express';
// import * as http from 'http';
// import Player from './entities/player';
// import Signal from './enums/signal';
// import { EventEmitter } from 'events';
// import signal from './enums/signal';
// import Match from './entities/match';
// declare const Buffer;
// export default class Server {
// 	static $: Server = null;
// 	httpServer: http.Server = null;
// 	wss: WebSocketServer = null;
// 	config: any = null;
// 	eventEmitter: EventEmitter = new EventEmitter();
// 	constructor() {
// 		Server.$ = this;
// 	}
// 	async init() {
// 		console.log('Loading config...');
// 		console.log('Loading dictionary...');
// 		if (process.env.PORT) {
// 			console.log('Creating http server...');
// 			let app = express();
// 			this.httpServer = http.createServer(app);
// 			this.httpServer.listen(process.env.PORT || this.config.port);
// 		}
// 		console.log('Setting up ws server...');
// 		this.setupWebSocket();
// 		this.bindEvents();
// 	}
// 	bindEvents() {
// 		this.eventEmitter.on(signal.MATCH, (eventData) => this.onRequestMatch(eventData));
// 	}
// 	onRequestMatch({ player, data }) {
// 		let match = Match.getMatch();
// 		match.join(player);
// 	}
// 	setupWebSocket() {
// 		if (process.env.PORT) {		// Heroku 
// 			//@ts-ignore
// 			this.wss = new WebSocketServer({ server: this.httpServer });
// 			console.log('\x1b[33m%s\x1b[0m', `Websocket server listening on port ${process.env.PORT || this.config.port}...`);
// 			this.wss.on('connection', ws => {
// 				let player = Player.getPlayer(ws);
// 				this.onConnection(player);
// 				ws.on('message', (message: string) => {
// 					this.onMessage(player, message);
// 					let dataTransfer = JSON.parse(Buffer.from(message, 'base64').toString())
// 					player.match.broadcastExept(player, signal.MOVE, {player, data: dataTransfer})
// 				});
// 				ws.on('close', (ws: WebSocket) => {
// 					this.onClose(player);
// 				});
// 			});
// 		} else {					//Local
// 			//@ts-ignore
// 			this.wss = new WebSocketServer({ port: 8080 }, () => {
// 				console.log('\x1b[33m%s\x1b[0m', `Websocket server listening on port 8080...`);
// 				this.wss.on('connection', ws => {
// 					let player = Player.getPlayer(ws);
// 					this.onConnection(player);
// 					ws.on('message', (message: string) => {
// 						this.onMessage(player, message);
// 						let dataTransfer = JSON.parse(Buffer.from(message, 'base64').toString())
// 						player.match.broadcastExept(player, signal.MOVE, {player, data: dataTransfer})
// 					});
// 					ws.on('close', (ws: WebSocket) => {
// 						this.onClose(player);
// 					});
// 				});
// 			});
// 		}
// 	}
// 	onConnection(player: Player) {
// 		console.log(`Player ${player.uuid} has connected!`);
// 		player.send(Signal.UUID, player.uuid);
// 	}
// 	onClose(player: Player) {
// 		player.remove();
// 		console.log(`Player ${player.uuid} has disconnected!`);
// 	}
// 	onError(player: Player, err) {
// 		console.log(`Player ${player.uuid} has encountered an error!`, err);
// 	}
// 	onMessage(player: Player, message: string) {
// 		try {
// 			let data = JSON.parse(Buffer.from(message, 'base64').toString());
// 			console.log(`Player ${player.uuid}: `, data);
// 			this.eventEmitter.emit(data.signal, { player, data });
// 		} catch (ex) {
// 			console.error(ex);
// 			console.error(`Player ${player.uuid} unknown package: `, message);
// 		}
// 	}
// 	send(player: Player, signal: string, message: object) {
// 		player.send(signal, message);
// 	}
// }
