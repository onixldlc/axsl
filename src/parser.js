class DSLParser {
	/**
	 * Validates and parses the DSL structure
	 * @param {object} dsl - Raw DSL object
	 * @returns {object} - Validated and parsed DSL
	 */
	parse(dsl) {
	  this.validateDSL(dsl);
	  return this.normalizeDSL(dsl);
	}
  
	/**
	 * Validates the DSL structure
	 * @param {object} dsl - DSL object to validate
	 */
	validateDSL(dsl) {
	  if (!dsl || typeof dsl !== 'object') {
		throw new Error('DSL must be a valid object');
	  }
  
	  if (!dsl.pipeline || !Array.isArray(dsl.pipeline)) {
		throw new Error('DSL must contain a "pipeline" array');
	  }
  
	  const stepNames = new Set();
  
	  for (const step of dsl.pipeline) {
		this.validateStep(step);
		
		if (stepNames.has(step.name)) {
		  throw new Error(`Name collision detected: "${step.name}" is used more than once.`);
		}
		stepNames.add(step.name);
	  }
	}
  
	/**
	 * Validates a single step
	 * @param {object} step - Step object to validate
	 */
	validateStep(step) {
	  if (!step || typeof step !== 'object') {
		throw new Error('Each step must be a valid object');
	  }
  
	  if (!step.name || typeof step.name !== 'string') {
		throw new Error('Each step must have a valid "name" string');
	  }
  
		if (step.type === 'js') {
			if (typeof step.code !== 'string' && !Array.isArray(step.code)) {
				throw new Error(`JS step "${step.name}" must have a "code" string/array`);
			}
			if (Array.isArray(step.code)) {
				step.code = step.code.join('\n');
			}
		} else {
			if (!step.method || typeof step.method !== 'string') {
				throw new Error(`Step "${step.name}" must have a valid "method" string`);
			}
		
			if (!step.url || typeof step.url !== 'string') {
				throw new Error(`Step "${step.name}" must have a valid "url" string`);
			}
		
			const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
			if (!validMethods.includes(step.method.toUpperCase())) {
				throw new Error(`Step "${step.name}" has invalid method "${step.method}". Valid methods: ${validMethods.join(', ')}`);
			}

			if (step.continueOnError !== undefined && typeof step.continueOnError !== 'boolean') {
				throw new Error(`Step "${step.name}" has invalid "continueOnError" value. Must be a boolean.`);
			}
		}
	}
  
	/**
	 * Normalizes the DSL structure
	 * @param {object} dsl - DSL object to normalize
	 * @returns {object} - Normalized DSL
	 */
	normalizeDSL(dsl) {
	  return {
		...dsl,
		pipeline: dsl.pipeline.map(step => this.normalizeStep(step))
	  };
	}
  
	/**
	 * Normalizes a single step
	 * @param {object} step - Step to normalize
	 * @returns {object} - Normalized step
	 */
	normalizeStep(step) {
	  const stepType = step.type === 'js' ? 'js' : 'http';
	  return {
		name: step.name,
		type: stepType,
		method: stepType === 'http' ? step.method.toUpperCase() : undefined,
		url: stepType === 'http' ? step.url : undefined,
		code: stepType === 'js' ? step.code : undefined,
		body: step.body || null,
		headers: step.headers || {},
		contentType: step.contentType || null,
		onSuccess: step.onSuccess || null,
		continueOnError: step.continueOnError || false,
		allowSelfSignedSSL: step.allowSelfSignedSSL || false
	  };
	}
}
  
module.exports = DSLParser;