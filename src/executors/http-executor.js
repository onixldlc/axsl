const axios = require('axios');
const https = require('https');  // Add the https module import

class HttpExecutor {
  constructor(templating) {
    this.templating = templating;
  }

  /**
   * Indicates whether this executor can handle the current step
   * @param {object} step - DSL step object
   * @returns {boolean} - True if step is HTTP-based (default or explicitly 'http')
   */
  canHandle(step) {
    return !step.type || step.type === 'http';
  }

  /**
   * Executes an HTTP step
   * @param {object} step - DSL step data
   * @param {object} sessionStore - Session store object
   */
  async execute(step, sessionStore) {
    const { name, method, url, body, onSuccess, allowSelfSignedSSL } = step;

    const replacedUrl = this.templating.replacePlaceholdersInString(url);
    const replacedBody = this.templating.replacePlaceholders(body);

    const unresolvableUrl = this.templating.validatePlaceholders(url);
    const unresolvableBody = this.templating.validateAllPlaceholders(body);
    if (unresolvableUrl.length > 0 || unresolvableBody.length > 0) {
      console.warn(
        `Step "${name}" has unresolvable placeholders:`,
        [...unresolvableUrl, ...unresolvableBody]
      );
    }

    console.log(`Executing HTTP step: ${name} -> [${method}] ${replacedUrl}`);

    const requestConfig = {
      method,
      url: replacedUrl,
      data: replacedBody
    };

    if (allowSelfSignedSSL === true) {
      console.log(`Step "${name}" is allowing self-signed SSL certificates`);
      requestConfig.httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });
    }

    const response = await axios(requestConfig);

    sessionStore[name] = response;

    if (onSuccess && onSuccess.store) {
      const { alias } = onSuccess.store;
      if (alias) {
        sessionStore[alias] = response;
      }
    }

    return response;
  }
}

module.exports = HttpExecutor;