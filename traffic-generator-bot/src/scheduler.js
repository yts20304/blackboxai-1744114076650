const cron = require('node-cron');
const { logger } = require('./logger');
const TrafficEngine = require('./trafficEngine');
const AdSimulator = require('./adSimulator');
const config = require('../config.json');

/**
 * Scheduler class manages scheduled tasks for traffic generation and ad simulation
 */
class Scheduler {
  constructor() {
    this.trafficEngine = new TrafficEngine();
    this.adSimulator = new AdSimulator();
    logger.info('Scheduler initialized');
  }

  /**
   * Start the scheduler for traffic generation
   */
  start() {
    if (config.scheduler.enabled) {
      const cronExpression = this.getCronExpression();
      cron.schedule(cronExpression, async () => {
        logger.info('Running scheduled traffic generation task');
        await this.trafficEngine.launchBrowser();
        await this.trafficEngine.generateTraffic(this.getRandomKeyword());
        await this.adSimulator.simulateAdViews(this.trafficEngine.page);
        await this.trafficEngine.closeBrowser();
      });
      logger.info(`Scheduler started with cron expression: ${cronExpression}`);
    } else {
      logger.info('Scheduler is disabled in configuration');
    }
  }

  /**
   * Get a random keyword from the configuration
   * @returns {string} Random keyword
   */
  getRandomKeyword() {
    const keywords = config.trafficGeneration.keywords;
    return keywords[Math.floor(Math.random() * keywords.length)];
  }

  /**
   * Get cron expression based on configuration
   * @returns {string} Cron expression
   */
  getCronExpression() {
    const { dailyStartTime, dailyEndTime } = config.scheduler;
    return `0 ${dailyStartTime.split(':')[1]} ${dailyStartTime.split(':')[0]}-${dailyEndTime.split(':')[0]} * * *`;
  }
}

module.exports = Scheduler;
