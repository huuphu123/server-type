import Player from './player';
import signal from '../enums/signal';
import Server from '../server';

let MIID = 0;
export default class Match {
	static pendingMatches: Match[] = [];

	static getMatch(): Match {
		if (Match.pendingMatches.length > 0) {
			return Match.pendingMatches.pop();
		} else {
			let match = new Match(1);
			Match.pendingMatches.push(match);
			return match;
		}
	}

	level: number = 0;
	players: Player[] = [];
	time: number = 400;
	letters: string = null;
	running: boolean = false;

	red_pid: number = 0;
	blue_pid: number = 0;


	score = {};

	constructor(level: number) {
		this.level = level;
		let counts = [39, 61];
		let ids = [];
		for(let i = 0; i < counts[level]; i++){
			ids.push(i);
		}
	}

	broadcast(signal: string, data?: any) {
		let totalPlayers = this.players.length;
		for (let i = totalPlayers - 1; i >= 0; i--) {
			let player = this.players[i];
			if (player) {
				player.send(signal, data);
				for (let key in Player.players) {
					let player = Player.players[key];
					if (player) {
						player.send(signal, data);
					}
				}
			}
		}
	}

	broadcastExclude(exclude_player: any, signal: string, data?: any) {
		let totalPlayers = this.players.length;
		for (let i = totalPlayers - 1; i >= 0; i--) {
			let player = this.players[i];
			if (exclude_player.uuid == player.uuid) {
				continue;
			}
			if (player) {
				for (let key in Player.players) {
					let player = Player.players[key];
					if (player.uuid != exclude_player.uuid) {
						console.log("broadcastExclude", player.uuid, exclude_player.uuid);
						player.send(signal, data);
					}
				}
			}
		}
	}

	broadcastExcept(excludedPlayer: Player, signal: string, data?: any) {
		let totalPlayers = this.players.length;
		for (let i = totalPlayers - 1; i >= 0; i--) {
			let player = this.players[i];
			if (player !== excludedPlayer) {
				player.send(signal, data);
			}
		}
	}

	start() {
		this.running = true;

		// shuffle the players array
		this.players.sort(() => Math.random() - 0.5);
		this.broadcast(signal.MATCH, { 
			level: this.level, 
			time: this.time,
			blue_id: this.players[0].uuid,
			red_id: this.players[1].uuid,
		});
		setTimeout(() => {
			this.timeup();
		}, this.time * 1000);
		this.close();
	}

	stop() {
		this.running = false;
		this.broadcast(signal.RESULT, { interrupted: this.players.length < 2 });
		this.close();
		this.players.forEach(player => {
			this.leave(player, true);
		});
	}

	timeup() {
		if (this.running) {
			this.stop();
		}
	}

	join(player: Player) {
		if (this.players.length >= 2 || this.players.indexOf(player) >= 0) {
			return;
		}

		this.players.push(player);
		player.match = this;
		this.broadcast(signal.JOIN, { 
			uuid: player.uuid 
		});
		this.score[player.uuid] = {
			score: 0
		};

		if (this.players.length >= 2) {
			this.start();
		}
	}

	leave(player: Player, silence?: boolean) {
		if (this.players.indexOf(player) < 0) {
			return;
		}
		player.match = null;
		this.players.splice(this.players.indexOf(player), 1);
		if (!silence) {
			this.broadcast(signal.LEAVE, { uuid: player.uuid });
		}
		if (this.running) {
			this.stop();
		}
		this.close();
	}

	close() {
		if (Match.pendingMatches.indexOf(this) >= 0) {
			Match.pendingMatches.splice(Match.pendingMatches.indexOf(this), 1);
		}
	}
}
