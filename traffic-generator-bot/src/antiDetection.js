const { getRandomUserAgent, randomDelay, getRandomInt } = require('./utilities');
const { logger } = require('./logger');

/**
 * AntiDetection class manages strategies to avoid bot detection
 */
class AntiDetection {
  constructor(config) {
    this.config = config;
    logger.info('Anti-detection module initialized');
  }

  /**
   * Setup browser with anti-detection configurations
   * @param {Object} browser - Puppeteer browser instance
   * @param {Object} page - Puppeteer page instance
   */
  async setupBrowserProfile(browser, page) {
    try {
      // Apply user agent based on configuration
      const userAgent = this.rotateUserAgent();
      await page.setUserAgent(userAgent);
      
      // Set default headers to mimic real browsers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'DNT': '1' // Do Not Track
      });
      
      // Set timezone to avoid timezone-based fingerprinting
      const timezones = [
        'America/New_York', 
        'America/Chicago', 
        'America/Denver', 
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Australia/Sydney'
      ];
      const timezone = timezones[Math.floor(Math.random() * timezones.length)];
      
      await page.evaluateOnNewDocument((timezone) => {
        // Override timezone
        Object.defineProperty(Intl, 'DateTimeFormat', {
          get: function() {
            return function(locales, options) {
              if (options && options.timeZone) {
                options.timeZone = timezone;
              }
              return new Intl.DateTimeFormat(locales, options);
            };
          }
        });
        
        // Override language preferences
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en']
        });
        
        // Spoof plugins length
        Object.defineProperty(navigator, 'plugins', {
          get: () => {
            return new Array(getRandomInt(1, 5))
              .fill()
              .map(() => ({
                name: 'Chrome PDF Plugin',
                filename: 'internal-pdf-viewer',
                description: 'Portable Document Format'
              }));
          }
        });
        
        // Canvas fingerprinting protection
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function(type) {
          if (type === 'image/png' && this.width === 16 && this.height === 16) {
            // Likely a fingerprinting attempt
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAmJLR0QA/4ePzL8AAAAJ0cEhZcwAADsMAAA7DAcdvqGQAAAAjUlEQVQ4y2NgoBAwQvF/QngLLvkDONS9R+OzM+BTCNLwAYj5oXQTksJNaHItDAwMYUia30HFQHpbGBgYQOJtUDEQmxnEMELpJVDxA0AchaRRm4GB4QNUDk0zQx4DA0MylJ9IvD+ZsXiLBc1gELiAT45YAF0XVkfiU4jLgM1I/ElI4hPI/FYkcQYGBgYA35Am4AvSPLAAAAAASUVORK5CYII=';
          }
          return originalToDataURL.apply(this, arguments);
        };
      }, timezone);
      
      logger.debug('Browser anti-detection profile configured successfully');
    } catch (error) {
      logger.error(`Error setting up browser profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rotate user agent based on configuration
   * @returns {string} User agent string
   */
  rotateUserAgent() {
    return getRandomUserAgent(this.config.userAgents);
  }

  /**
   * Simulate realistic mouse movements
   * @param {Object} page - Puppeteer page instance
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   */
  async simulateHumanMouseMovement(page, x, y) {
    if (!this.config.antiDetection.enableMouseMovements) {
      await page.mouse.move(x, y);
      return;
    }
    
    try {
      // Get current mouse position (defaults to 0,0 if not moved yet)
      const currentPosition = { x: 0, y: 0 };
      
      // Calculate distance and determine number of steps
      const distance = Math.sqrt(
        Math.pow(x - currentPosition.x, 2) + 
        Math.pow(y - currentPosition.y, 2)
      );
      
      // More steps for longer distances to make it smoother
      const steps = Math.max(10, Math.floor(distance / 10));
      
      // Generate a slightly curved path using Bezier curve simulation
      const bezierPoints = this.generateBezierCurve(
        currentPosition.x, currentPosition.y, 
        x, y, 
        steps
      );
      
      // Move through the points with varying speed
      for (let i = 0; i < bezierPoints.length; i++) {
        const point = bezierPoints[i];
        
        // Vary the speed - slower at start and end, faster in the middle
        const progress = i / steps;
        const speedFactor = this.getSpeedFactor(progress);
        
        await page.mouse.move(
          Math.round(point.x), 
          Math.round(point.y)
        );
        
        // Calculate delay based on speed configuration and progress
        const baseSpeed = getRandomInt(
          this.config.antiDetection.mouseMovement.speed.min,
          this.config.antiDetection.mouseMovement.speed.max
        );
        const delay = baseSpeed * speedFactor / steps;
        
        await randomDelay(delay * 0.8, delay * 1.2);
      }
      
      logger.debug(`Simulated human mouse movement to (${x}, ${y})`);
    } catch (error) {
      logger.error(`Error simulating mouse movement: ${error.message}`);
      // Fallback to direct movement
      await page.mouse.move(x, y);
    }
  }
  
  /**
   * Generate points along a Bezier curve for mouse movement
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} endX - Ending X coordinate
   * @param {number} endY - Ending Y coordinate
   * @param {number} steps - Number of points to generate
   * @returns {Array} Array of {x, y} points
   */
  generateBezierCurve(startX, startY, endX, endY, steps) {
    // Create control points for the Bezier curve
    // Add some randomness to the control points to create natural curves
    const controlX1 = startX + (endX - startX) * 0.3 + getRandomInt(-30, 30);
    const controlY1 = startY + (endY - startY) * 0.1 + getRandomInt(-30, 30);
    const controlX2 = startX + (endX - startX) * 0.7 + getRandomInt(-30, 30);
    const controlY2 = startY + (endY - startY) * 0.9 + getRandomInt(-30, 30);
    
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      
      // Cubic Bezier formula
      const x = Math.pow(1 - t, 3) * startX +
                3 * Math.pow(1 - t, 2) * t * controlX1 +
                3 * (1 - t) * Math.pow(t, 2) * controlX2 +
                Math.pow(t, 3) * endX;
                
      const y = Math.pow(1 - t, 3) * startY +
                3 * Math.pow(1 - t, 2) * t * controlY1 +
                3 * (1 - t) * Math.pow(t, 2) * controlY2 +
                Math.pow(t, 3) * endY;
                
      points.push({ x, y });
    }
    
    return points;
  }
  
  /**
   * Get speed factor based on progress (slower at start/end, faster in middle)
   * @param {number} progress - Progress from 0 to 1
   * @returns {number} Speed factor
   */
  getSpeedFactor(progress) {
    // Ease in and out function
    return 0.5 - 0.5 * Math.cos(progress * Math.PI);
  }

  /**
   * Simulate human-like scrolling behavior
   * @param {Object} page - Puppeteer page instance
   * @param {number} distance - Scrolling distance in pixels (positive for down, negative for up)
   */
  async simulateHumanScrolling(page, distance) {
    if (!this.config.antiDetection.enableRandomScrolling) {
      await page.evaluate((dist) => window.scrollBy(0, dist), distance);
      return;
    }
    
    try {
      // Get scroll config
      const scrollConfig = this.config.antiDetection.scrollBehavior;
      
      // Break the scroll into smaller chunks for natural movement
      const chunks = Math.ceil(Math.abs(distance) / 100);
      const scrollStep = distance / chunks;
      
      for (let i = 0; i < chunks; i++) {
        // Calculate scroll speed (pixels per second)
        const scrollSpeed = getRandomInt(
          scrollConfig.speed.min,
          scrollConfig.speed.max
        );
        await page.evaluate((dist) => window.scrollBy(0, dist), scrollStep);
        await randomDelay(scrollSpeed, scrollSpeed * 1.5); // Random delay between scrolls
      }
      
      logger.debug(`Simulated human scrolling by ${distance} pixels`);
    } catch (error) {
      logger.error(`Error simulating scrolling: ${error.message}`);
    }
  }
}

module.exports = AntiDetection;
