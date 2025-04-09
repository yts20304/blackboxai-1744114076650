const { logger } = require('./src/logger');
const { Telegraf } = require('telegraf');
const TrafficEngine = require('./src/trafficEngine');
const AdSimulator = require('./src/adSimulator');
const Scheduler = require('./src/scheduler');
const config = require('./config.json');

const bot = new Telegraf(config.telegram.token);

bot.start((ctx) => {
  ctx.reply('Welcome! The bot is now running.');
  logger.info('Bot started command received');
});

bot.launch();

(async () => {
  try {
    logger.info('Starting Traffic Generator Bot');

    // Initialize the scheduler
    const scheduler = new Scheduler();
    scheduler.start();

    // Keep the process alive
    process.on('SIGINT', async () => {
      logger.info('Shutting down Traffic Generator Bot');
      await scheduler.trafficEngine.closeBrowser();
      process.exit();
    });
  } catch (error) {
    logger.error(`Error starting the bot: ${error.message}`);
  }
})();
