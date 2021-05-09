const NATS = require('nats');
const nc = NATS.connect({
  url: process.env.NATS_URL || 'nats://nats:4222',
});

const TelegramBot = require('node-telegram-bot-api');
const CHAT_ID = 1324263694;
const bot = new TelegramBot(process.env.SECRET_TELEGRAM_TOKEN, {
  polling: true,
});

nc.subscribe(
  'broadcaster_data',
  { queue: 'broadcaster.workers' },
  async (msg) => {
    const { message, data } = JSON.parse(msg);
    await bot.sendMessage(
      CHAT_ID,
      `${message} \n ${JSON.stringify(data, null, 2)}`,
    );
  },
);

// Get chat id this way
/*bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log('chatId', chatId);
  bot.sendMessage(chatId, 'Message received!');
});*/

console.log('Project broadcaster listening');
