const axios = require('axios');
const https = require('https');

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
    const { name, method, url, body, headers, onSuccess, allowSelfSignedSSL, contentType } = step;

    const replacedUrl = this.templating.replacePlaceholdersInString(url);
    
    let replacedBody = body;
    if (replacedBody !== null) {
      if (typeof replacedBody === 'string') {
        replacedBody = this.templating.replacePlaceholdersInString(body);
      } else {
        replacedBody = this.templating.replacePlaceholders(body);
      }
    }

    let processedHeaders = {};
    if (headers && typeof headers === 'object') {
      for (const [key, value] of Object.entries(headers)) {
        processedHeaders[key] = this.templating.replacePlaceholdersInString(value);
      }
    }

    const unresolvableUrl = this.templating.validatePlaceholders(url);
    const unresolvableBody = typeof body === 'string'
      ? this.templating.validatePlaceholders(body)
      : this.templating.validateAllPlaceholders(body);
      
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
      headers: processedHeaders
    };

    if (contentType) {
      requestConfig.headers['Content-Type'] = contentType;
      
      if (contentType.includes('xml') || contentType.includes('text/') || contentType.includes('plain')) {
        if (typeof replacedBody === 'object' && replacedBody !== null) {
          console.warn(`Step "${name}" has object body with text/xml content type. Consider using a string body instead.`);
        }
        requestConfig.data = typeof replacedBody === 'string' ? replacedBody : JSON.stringify(replacedBody);
      } else {
        requestConfig.data = replacedBody;
      }
    } else if (replacedBody !== null) {
      if (typeof replacedBody === 'object') {
        requestConfig.headers['Content-Type'] = 'application/json';
      }
      requestConfig.data = replacedBody;
    }

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