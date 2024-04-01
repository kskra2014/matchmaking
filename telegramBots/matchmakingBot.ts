import TelegramBot from 'node-telegram-bot-api'
const { TELEGRAM_BOT_TOKEN } = process.env
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })

let ids_array = []

bot.sendMessageAll = (msg) => {
    ids_array.forEach(id => {
        bot.sendMessage(id, msg);
    });
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    switch (msg.text) {
        case '/start':
            if (!ids_array.filter((id) => { id === chatId }).length) {
                ids_array.push(chatId)
                bot.sendMessage(chatId, (new Date) + '\n' + 'You are added to the list.');
            } else {
                bot.sendMessage(chatId, (new Date) + '\n' + 'You are already in the list.');
            }
            break;
        case '/stop':
            ids_array = ids_array.filter((id) => { id !== chatId })
            bot.sendMessage(chatId, (new Date) + '\n' + 'You are removed from the list.');
            break;
        default:
            // bot.sendMessage(chatId, (new Date) + '\n' + 'You are not in the list.');
            break;
    }
});

export { bot }