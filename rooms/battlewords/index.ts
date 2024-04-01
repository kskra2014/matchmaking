import { Room } from "colyseus";
import State from "./state";
import { Me, UpdateStatus } from "../../api";
import config from "../../config";
import { colors } from "../../utils";
import { Game } from "./Game";
import { Rank } from "./Rank";

export default class BattleWords extends Room<State> {
  Game: Game;
  Rank: Rank;
  autoDispose: boolean = true;
  maxClients: number = 2;

  constructor() {
    super();
    this.Game = new Game(this);
    this.Rank = new Rank();
  }

  onInit({ clientId }) {
    console.log(" ");
    console.log(" ");
    console.log(colors.FgWhite, "Client", clientId, "inited the room");
    console.log(" ");
    this.setState(new State());
  }

  requestJoin({ accessToken, clientId }, isNew) {
    console.log(
      colors.FgWhite,
      "Client",
      clientId,
      "Requested join with Token",
      accessToken.substr(accessToken.length - 5)
    );
    console.log(" ");

    if (accessToken) return true;
    return false;
  }

  async onAuth({ accessToken }) {
    console.log(colors.FgWhite, "Auth requested");
    console.log(
      colors.FgBlue,
      "Auth User accessToken:",
      accessToken.substr(accessToken.length - 5)
    );

    let user = await Me(accessToken);

    if (user) {
      user.accessToken = accessToken;

      console.log(colors.FgBlue, "Auth user username", user.username);
      console.log(colors.FgBlue, "Auth user Status", user.status);
      console.log(" ");
      return this.Rank.validate(user) ? user : false;
    }
    return user;
  }

  async onJoin(client, options, user) {
    console.log(colors.FgWhite, "Client", client.id, "is joining ...");

    this.state.addPlayer(client, user);
    this.Game.addUser(client, user);

    console.log(
      colors.FgMagenta,
      "Active player is",
      this.state.getActivePlayer() || "notSet"
    );
    this.state.setActivePlayerOnce(client.id);

    if (await UpdateStatus(user.accessToken, "playing", client.sessionId)) {
      console.log(
        colors.FgYellow,
        "Status Updated to playing with sessionId",
        client.sessionId
      );
      console.log(" ");
      this.start();
    } else {
      this.send(client, {
        error: "Error while updating status"
      });
      client.close();
      console.log(colors.FgRed, "Client", client.id, "closed by server");
      console.log(" ");
    }
  }

  async onLeave(client, consented: boolean) {
    console.log(colors.FgWhite, "Client", client.id, "left or closed");

    this.state.players[client.id].connected = false;

    try {
      if (consented) {
        this.state.players[client.id].left = true;
        throw Error(`Client ${client.id} Left on purpose or Closed by server`);
      }
      this.Game.delayed.pause();
      this.Game.turnDelayed.pause();
      await this.allowReconnection(client, config.reconnectionTime);
      console.log(colors.FgWhite, "Client", client.id, "re joined !");
      this.state.players[client.id].connected = true;
      this.Game.delayed.resume();
      this.Game.turnDelayed.resume();
    } catch (e) {
      console.log(" ");
      console.log(
        colors.FgRed,
        e.message || "Exceeded allow reconnection time maybe!"
      );
      const { accessToken } = this.Game.users.find(
        user => user.id === client.id
      );
      if (await UpdateStatus(accessToken, "offline", "")) {
        console.log(colors.FgYellow, "Status Updated to offline");
      }
      console.log(" ");
      if (this.Game.time !== 0 && this.Game.users.length === 2) {
        this.Game.endGame();
      }
    }
  }

  onMessage(client, data) {
    console.log(colors.FgCyan, "Client", client.id, "Says", data);
    console.log(" ");
    this.Game.setWord(client.id, data.word);
  }

  onDispose() {
    console.log(colors.FgRed, "-----> Room", this.roomId, " Disposed <-----");
    console.log(" ");
  }

  start() {
    if (this.clients.length === 2) {
      this.lock();
      console.log(colors.FgGreen, "Starting the Game ...");
      this.Game.start();
    }
  }
}
