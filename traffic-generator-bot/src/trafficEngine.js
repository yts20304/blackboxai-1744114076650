const puppeteer = require('puppeteer');
const { logger, activityLogger } = require('./logger');
const { randomDelay, isValidUrl } = require('./utilities');
const AntiDetection = require('./antiDetection');
const config = require('../config.json');

/**
 * TrafficEngine class handles traffic generation
 */
class TrafficEngine {
  constructor() {
    this.browser = null;
    this.page = null;
    this.antiDetection = new AntiDetection(config);
    logger.info('Traffic Engine initialized');
  }

  /**
   * Launch the browser and open a new page
   */
  async launchBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: config.browser.headless,
        defaultViewport: config.browser.defaultViewport,
        slowMo: config.browser.slowMo
      });
      this.page = await this.browser.newPage();
      await this.antiDetection.setupBrowserProfile(this.browser, this.page);
      logger.info('Browser launched successfully');
    } catch (error) {
      logger.error(`Error launching browser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Close the browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      logger.info('Browser closed');
    }
  }

  /**
   * Generate traffic to target domains
   * @param {string} keyword - Keyword to search
   */
  async generateTraffic(keyword) {
    try {
      const searchUrl = `${config.trafficGeneration.searchEngines.google}?q=${encodeURIComponent(keyword)}`;
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2' });
      activityLogger.logSearch(keyword, 'Google');
      logger.info(`Navigated to search results for keyword: ${keyword}`);

      // Simulate clicking on a target domain from the search results
      const targetDomain = this.getRandomTargetDomain();
      await this.clickTargetDomain(targetDomain);
    } catch (error) {
      logger.error(`Error generating traffic: ${error.message}`);
    }
  }

  /**
   * Click on a target domain from the search results
   * @param {string} domain - Domain to click
   */
  async clickTargetDomain(domain) {
    try {
      const links = await this.page.$$('a'); // Get all links on the page
      const targetLink = links.find(link => link.href.includes(domain));
      
      if (targetLink) {
        await targetLink.click();
        activityLogger.logVisit(domain);
        logger.info(`Clicked on target domain: ${domain}`);
        
        // Wait for the page to load
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      } else {
        logger.warn(`Target domain ${domain} not found on the page`);
      }
    } catch (error) {
      logger.error(`Error clicking target domain: ${error.message}`);
    }
  }

  /**
   * Get a random target domain from the configuration
   * @returns {string} Random target domain
   */
  getRandomTargetDomain() {
    const domains = config.trafficGeneration.targetDomains;
    return domains[Math.floor(Math.random() * domains.length)];
  }
}

module.exports = TrafficEngine;
