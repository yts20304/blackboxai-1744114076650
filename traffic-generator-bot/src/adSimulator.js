const { randomDelay, shouldPerformAction } = require('./utilities');
const { logger, activityLogger } = require('./logger');
const config = require('../config.json');

/**
 * AdSimulator class handles ad view and click simulation
 */
class AdSimulator {
  constructor() {
    logger.info('Ad Simulator initialized');
  }

  /**
   * Simulate ad views based on configuration
   * @param {Object} page - Puppeteer page instance
   */
  async simulateAdViews(page) {
    try {
      if (!config.adSimulation.enabled) {
        logger.info('Ad simulation is disabled in configuration');
        return;
      }

      const adViewProbability = config.adSimulation.viewProbability;
      const adClickProbability = config.adSimulation.clickProbability;

      // Simulate ad view
      if (shouldPerformAction(adViewProbability)) {
        const adType = 'banner'; // Example ad type
        const viewTime = randomDelay(config.adSimulation.minViewTimeSeconds * 1000, config.adSimulation.maxViewTimeSeconds * 1000);
        await viewAd(adType, viewTime);
      }

      // Simulate ad click
      if (shouldPerformAction(adClickProbability)) {
        const adType = 'banner'; // Example ad type
        await clickAd(adType);
      }
    } catch (error) {
      logger.error(`Error simulating ad views: ${error.message}`);
    }
  }

  /**
   * Simulate viewing an ad
   * @param {string} adType - Type of ad being viewed
   * @param {number} viewTime - Time to view the ad in milliseconds
   */
  async viewAd(adType, viewTime) {
    logger.info(`Viewing ${adType} ad for ${viewTime / 1000} seconds`);
    await randomDelay(viewTime);
    activityLogger.logAdView(adType, viewTime / 1000, 'current_url'); // Replace 'current_url' with actual URL
  }

  /**
   * Simulate clicking an ad
   * @param {string} adType - Type of ad being clicked
   */
  async clickAd(adType) {
    logger.info(`Clicking on ${adType} ad`);
    // Simulate the click action here
    activityLogger.logAdClick(adType, 'current_url'); // Replace 'current_url' with actual URL
  }
}

module.exports = AdSimulator;
