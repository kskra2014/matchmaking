export default class Player {
  xp: number;
  _id: string;
  username: string;

  connected: boolean = true;
  left: boolean = false;
  coin: number = 0;
  score: number = 0;
  word: string = "";
  words: string[] = [];

  constructor({ xp, _id, username }) {
    this.xp = xp
    this._id = _id
    this.username = username
  }
}
