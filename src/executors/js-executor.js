class JsExecutor {
    constructor(templating) {
        this.templating = templating;
    }
  
    /**
     * Indicates whether this executor can handle the current step
     * @param {object} step
     * @returns {boolean} - True if step.type is 'js'
     */
    canHandle(step) {
      return step.type === 'js';
    }
  
    /**
     * Executes a JS snippet from the DSL
     * @param {object} step - DSL step data; expected to have { code: string }
     * @param {object} sessionStore - Session store object
     */
    async execute(step, sessionStore) {
        const { name } = step;
        console.log(`Executing JS step: ${name}`);
    
        const code = this.normalizeCode(step.code, name);
    
        let result;
        try {
          const func = new Function('sessionStore', code);
          result = func(sessionStore);
    
          if (result instanceof Promise) {
            result = await result;
          }
        } catch (err) {
          throw new Error(`Failed to execute JS for step "${name}": ${err.message}`);
        }
    
        sessionStore[name] = result;
        
        console.log(`JS step ${name} completed with result type: ${typeof result}`);
        if (typeof result === 'object' && result !== null) {
          console.log(`Available properties: ${Object.keys(result).join(', ')}`);
        }
    
        return result;
    }
    
    /**
     * Normalizes code input to support both string and array formats
     * @param {string|string[]} code - Code as string or array of lines
     * @param {string} stepName - Name of the step for error reporting
     * @returns {string} - Normalized code as string
     */
    normalizeCode(code, stepName) {
        if (typeof code === 'string') {
        return code;
        } 
        
        if (Array.isArray(code)) {
        return code.join('\n');
        }

        throw new Error(`JS step "${stepName}" requires "code" as string or array of strings`);
    }
  }
  
  module.exports = JsExecutor;