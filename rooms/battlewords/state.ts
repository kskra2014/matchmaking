import config from "../../config";
import { colors } from "../../utils";
import Player from "./Player";

export default class State {
  private activePlayer: string = "";
  public clients = [];
  public players: object = {};
  public time: number = config.time;
  public matchTime: number = config.time;
  public started_at: Date;
  public isFinished: boolean = false;

  public setActivePlayerOnce(id) {
    if (!this.getActivePlayer()) {
      this.activePlayer = id;
    }
  }

  public setActivePlayer(id) {
    this.activePlayer = id;
  }

  public getActivePlayer() {
    return this.activePlayer || false;
  }

  public addPlayer(client, user) {
    const { id } = client;
    this.players[id] = new Player(user);
    this.clients.push(id);
  }

  public setScore(clientId, word, spentTime) {
    const { bounceAmt, bounceTime } = config;
    const wordLength = word === "TIMEDOUT" ? 0 : word.length;
    const score = spentTime < bounceTime ? wordLength + bounceAmt : wordLength;
    this.players[clientId].score += score;
  }

  public isActivePlayer(client): boolean {
    if (typeof client === "object") return this.activePlayer === client.id;
    return this.activePlayer === client;
  }

  public isEqualWords(): boolean {
    console.log(colors.FgBlue, "Clients", this.clients);
    if (this.clients && this.clients[0] && this.clients[1]) {
      return (
        this.players[this.clients[0]].words.length ===
        this.players[this.clients[1]].words.length
      );
    }
    return false;
  }

  public setCoin(id): any {
    const { score } = this.players[id];
    this.players[id].coin = this.calcCoin(score);
  }

  public calcCoin(score: number): number {
    return Math.floor(score / 3);
  }

  public enemyOf(clientId: string): any {
    return this.players[this.clients.find(id => id !== clientId)];
  }

  public getResult(clientId): string {
    const enemy = this.enemyOf(clientId);
    const { score, connected } = this.players[clientId];
    let status = "tie";
    if (score > enemy.score) status = "win";
    if (score < enemy.score) status = "loss";
    if (!connected) {
      status = "loss";
    }
    return status;
  }

  public switchActivePlayer() {
    this.setActivePlayer(
      this.clients.find(id => id !== this.getActivePlayer())
    );
  }

  public checkWord(word) {
    let words = [];
    this.clients.forEach(id => {
      words.push(this.players[id].words);
    });
    words = words.filter(w => w !== "TIMEDOUT");
    word = words.find(w => w === word);
    return word || false;
  }
}
