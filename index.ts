const dotenv = require('dotenv');
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'colyseus';
import { monitor } from '@colyseus/monitor';
import { bot } from './telegramBots/matchmakingBot';



// Import demo room handlers
import BattleWords from "./rooms/battlewords";

const port = Number(process.env.PORT || 2567);
const app = express();

// Attach WebSocket Server on HTTP Server.
const gameServer = new Server({
  server: createServer(app)
});

// Register BattleWordsRoom as "battlewords"
gameServer.register("battlewords", BattleWords);

app.get('/', function (req, res, next) {
  res.redirect('/colyseus')
})

// (optional) attach web monitoring panel
app.use('/colyseus', monitor(gameServer));

gameServer.onShutdown(function () {
  console.log(`game server is going down...`);
});

gameServer.listen(port);

process.on("uncaughtException", (e) => {
  console.log(e.stack);
  console.log('uncaughtException Message =>', e.message);
  bot.sendMessageAll((new Date) + '\n' + '#MM - #uncaughtException Message => ' + e.message);
  process.exit(1);
});

process.on('unhandledRejection', (e) => {
  console.log('#MM - #unhandledRejection Message =>', e.message);
  bot.sendMessageAll((new Date) + '\n' + 'unhandledRejection Message => ' + e.message);
  process.exit(1)
})


console.log(`Listening on http://localhost:${port}`);
