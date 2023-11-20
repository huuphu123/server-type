import WebSocket, { Server as WebSocketServer } from 'ws';
import * as express from 'express';
import * as http from 'http';
import Player from './entities/player';
import Signal from './enums/signal';
import { EventEmitter } from 'events';
import signal from './enums/signal';
import Match from './entities/match';
declare const Buffer;

export default class Server {
	static $: Server = null;

	httpServer: http.Server = null;
	wss: WebSocketServer = null;
	config: any = null;
	eventEmitter: EventEmitter = new EventEmitter();

	constructor() {
		Server.$ = this;
	}

	async init() {
		console.log('Loading config...');
		console.log('Loading dictionary...');
		if (process.env.PORT) {
			console.log('Creating http server...');
			let app = express();
			this.httpServer = http.createServer(app);
			this.httpServer.listen(process.env.PORT || this.config.port);
		}
		console.log('Setting up ws server...');
		this.setupWebSocket();
		this.bindEvents();
	}

	bindEvents() {
		this.eventEmitter.on(signal.MATCH, (eventData) => this.onRequestMatch(eventData));
	}

	onRequestMatch({ player, data }) {
		let match = Match.getMatch();
		match.join(player);
	}


	setupWebSocket() {
		if (process.env.PORT) {		// Heroku 
			//@ts-ignore
			this.wss = new WebSocketServer({ server: this.httpServer });
			console.log('\x1b[33m%s\x1b[0m', `Websocket server listening on port ${process.env.PORT || this.config.port}...`);
			this.wss.on('connection', ws => {
				let player = Player.getPlayer(ws);
				this.onConnection(player);
				ws.on('message', (message: string) => {
					this.onMessage(player, message);
					let dataTransfer = JSON.parse(Buffer.from(message, 'base64').toString())
					player.match.broadcastExept(player, signal.MOVE, {player, data: dataTransfer})
				});
				ws.on('close', (ws: WebSocket) => {
					this.onClose(player);
				});
			});
		} else {					//Local
			//@ts-ignore
			this.wss = new WebSocketServer({ port: 8080 }, () => {
				console.log('\x1b[33m%s\x1b[0m', `Websocket server listening on port 8080...`);
				this.wss.on('connection', ws => {
					let player = Player.getPlayer(ws);
					this.onConnection(player);
					ws.on('message', (message: string) => {
						this.onMessage(player, message);
						let dataTransfer = JSON.parse(Buffer.from(message, 'base64').toString())
						player.match.broadcastExept(player, signal.MOVE, {player, data: dataTransfer})
					});
					ws.on('close', (ws: WebSocket) => {
						this.onClose(player);
					});
				});
			});
		}

	}

	onConnection(player: Player) {
		console.log(`Player ${player.uuid} has connected!`);
		player.send(Signal.UUID, player.uuid);
	}

	onClose(player: Player) {
		player.remove();
		console.log(`Player ${player.uuid} has disconnected!`);
	}

	onError(player: Player, err) {
		console.log(`Player ${player.uuid} has encountered an error!`, err);
	}

	onMessage(player: Player, message: string) {
		try {
			let data = JSON.parse(Buffer.from(message, 'base64').toString());
			console.log(`Player ${player.uuid}: `, data);
			this.eventEmitter.emit(data.signal, { player, data });
		} catch (ex) {
			console.error(ex);
			console.error(`Player ${player.uuid} unknown package: `, message);
		}
	}

	send(player: Player, signal: string, message: object) {
		player.send(signal, message);
	}
}