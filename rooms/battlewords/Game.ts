import { storeResult } from "../../api";
import { colors } from "../../utils";
import { Room, Delayed } from "colyseus";
import config from "../../config";
import { validateWord } from "../../api";

export class Game {
  public users: any[] = [];
  public delayed: Delayed;
  public turnDelayed: Delayed;

  public spentTime: number;
  public time: number = config.time;

  private room: Room;
  private disconnectedClients: string[] = [];

  constructor(room) {
    this.room = room;
  }

  start() {
    console.log(colors.FgGreen, "Game started");
    this.room.state.started_at = Date.now();
    this.startTurn();
    this.startGame();
  }

  private startGame() {
    this.delayed = this.room.clock.setInterval(() => {
      console.log(colors.FgMagenta, {
        isFinished: this.room.state.isFinished,
        time: this.time
      });

      console.log(" ");

      if (this.time > 0) {
        this.room.state.time--;
        this.time--;
        return;
      }
      if (this.time === 0 && this.room.state.isEqualWords()) {
        this.delayed.clear();
        this.endGame();
      }
    }, 1000);
  }

  public async endGame() {
    this.time = 0;
    this.turnDelayed && this.turnDelayed.clear();
    this.delayed && this.delayed.clear();

    this.users.forEach(user => {
      const { id } = user;
      const status = this.room.state.getResult(id);
      this.room.state.players[id].status = status;
    })

    // every state change should be before isFinished
    this.room.state.isFinished = true;
    this.users.forEach(async user => {
      const { id, accessToken } = user;
      this.room.state.setCoin(id);

      const enemy = this.room.state.enemyOf(id);
      const status = this.room.state.getResult(id);
      const { score } = this.room.state.players[id];
      console.log(
        colors.FgBlue,
        "Pre Store Result Data",
        { status, score },
        "\n"
      );

      await storeResult(accessToken, {
        status,
        enemy: enemy._id,
        achieves: { xp: score, coin: this.room.state.calcCoin(score) }
      });
      console.log(colors.FgGreen, "client result is", {
        status,
        enemy: enemy.username,
        achieves: { xp: score, coin: this.room.state.calcCoin(score) }
      });
      console.log(colors.FgGreen, " ** Storing Result Done ** ");
      this.disconnectClient(id);
    });
  }

  private disconnectClient(clientId) {
    this.disconnectedClients.push(clientId);
    if (this.disconnectedClients.length === 2) {
      this.room.disconnect();
    }
  }

  public addUser({ id }, user) {
    this.users.push({ id, ...user });
  }

  private swichTurn(): void {
    this.turnDelayed && this.turnDelayed.clear();
    this.spentTime = 0;
    this.room.state.switchActivePlayer();
    this.room.state.players[this.room.state.getActivePlayer()]
      .started_at = (Date.now())
    this.startTurn();
  }

  private startTurn() {
    let timeLeft = config.turnTime;
    this.turnDelayed = this.room.clock.setInterval(() => {
      if (timeLeft === 0) {
        this.setWord(this.room.state.getActivePlayer(), "TIMEDOUT");
        console.log(colors.FgBlue, "Time Left:", timeLeft);
      }
      if (timeLeft > 0) {
        timeLeft--;
        console.log(colors.FgBlue, "Time Left:", timeLeft);
      }
      this.spentTime = config.turnTime - timeLeft;
    }, 1000);
  }

  public async setWord(clientId: string, word: string) {
    const user = this.users.find(u => u.id === clientId);
    if (this.room.state.isActivePlayer(clientId)) {
      let resultWord = "";
      if (word === "TIMEDOUT") {
        resultWord = "TIMEDOUT";
      } else {
        const doesWordExists = this.room.state.checkWord(word.trim());
        if (doesWordExists) {
          resultWord = "NaW";
        } else {
          resultWord = (await validateWord(user.accessToken, word.trim())).word;
        }
      }
      if (typeof resultWord === 'undefined') { resultWord = "NaW" }
      this.room.state.players[clientId].word = resultWord + ":" + Date.now();
      if (resultWord !== "NaW") {
        this.room.state.players[clientId].words.push(resultWord);
        this.room.state.setScore(clientId, word, this.spentTime);
        this.swichTurn();
      }
    } else {
      console.log(
        colors.FgRed,
        "Client",
        clientId,
        "is not active and sending message",
        word
      );
    }
  }
}
