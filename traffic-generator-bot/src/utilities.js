const userAgents = require('user-agents');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('./logger');

/**
 * Generates a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generates a random float between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random float
 */
const getRandomFloat = (min, max) => {
  return Math.random() * (max - min) + min;
};

/**
 * Creates a delay for a random amount of time
 * @param {number} minMs - Minimum milliseconds
 * @param {number} maxMs - Maximum milliseconds
 * @returns {Promise} Promise that resolves after the delay
 */
const randomDelay = async (minMs, maxMs) => {
  const delay = getRandomInt(minMs, maxMs);
  logger.debug(`Delaying for ${delay}ms`);
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Generates a random User-Agent string based on config
 * @param {Object} config - User agent configuration
 * @returns {string} User-Agent string
 */
const getRandomUserAgent = (config) => {
  let options = {};
  
  // Configure the user agent based on config
  if (config.types.includes('desktop') && !config.types.includes('mobile')) {
    options = { deviceCategory: 'desktop' };
  } else if (!config.types.includes('desktop') && config.types.includes('mobile')) {
    options = { deviceCategory: 'mobile' };
  }
  
  // Generate and return a random user agent
  const userAgent = new userAgents(options).toString();
  logger.debug(`Generated User-Agent: ${userAgent}`);
  return userAgent;
};

/**
 * Generates a unique session ID
 * @returns {string} Session ID
 */
const generateSessionId = () => {
  return uuidv4();
};

/**
 * Performs a weighted random selection
 * @param {Object} options - Object with options as keys and weights as values
 * @returns {string} Selected option
 */
const weightedRandom = (options) => {
  const weights = Object.values(options);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  let random = Math.random() * totalWeight;
  for (const [option, weight] of Object.entries(options)) {
    random -= weight;
    if (random <= 0) {
      return option;
    }
  }
  
  // Fallback to first option
  return Object.keys(options)[0];
};

/**
 * Generates typing delays to simulate human typing
 * @param {string} text - Text to type
 * @param {number} wpmMin - Minimum words per minute
 * @param {number} wpmMax - Maximum words per minute
 * @returns {Array} Array of delays in milliseconds for each character
 */
const generateTypingDelays = (text, wpmMin, wpmMax) => {
  // Calculate a random WPM within the range
  const wpm = getRandomInt(wpmMin, wpmMax);
  
  // Calculate base delay (60s * 1000ms) / (WPM * average 5 chars per word)
  const baseDelayMs = 60 * 1000 / (wpm * 5);
  
  // Generate a delay for each character with some variation
  return Array.from({ length: text.length }, () => {
    // Add some randomness to each keystroke
    return baseDelayMs * getRandomFloat(0.5, 1.5);
  });
};

/**
 * Checks if should perform an action based on probability
 * @param {number} probability - Probability from 0 to 1
 * @returns {boolean} True if action should be performed
 */
const shouldPerformAction = (probability) => {
  return Math.random() < probability;
};

/**
 * Adds random deviation to a value
 * @param {number} value - Base value
 * @param {number} deviationPercent - Maximum deviation percentage
 * @returns {number} Value with random deviation
 */
const addRandomDeviation = (value, deviationPercent = 10) => {
  const maxDeviation = value * (deviationPercent / 100);
  return value + getRandomFloat(-maxDeviation, maxDeviation);
};

/**
 * Simulates a natural pause in user activity
 * @param {Object} config - Configuration with min and max values
 * @returns {Promise} Promise that resolves after the pause
 */
const naturalPause = async (config) => {
  // Determine if we should have a longer break
  const isLongBreak = shouldPerformAction(0.1); // 10% chance for a longer break
  
  let min = config.pauseDuration.min;
  let max = config.pauseDuration.max;
  
  if (isLongBreak) {
    // For longer breaks, multiply by a factor
    min *= 3;
    max *= 5;
    logger.debug('Taking a longer break');
  }
  
  return randomDelay(min, max);
};

/**
 * Validates a URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

module.exports = {
  getRandomInt,
  getRandomFloat,
  randomDelay,
  getRandomUserAgent,
  generateSessionId,
  weightedRandom,
  generateTypingDelays,
  shouldPerformAction,
  addRandomDeviation,
  naturalPause,
  isValidUrl
};
