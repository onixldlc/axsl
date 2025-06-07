const DSLParser = require('./parser.js');
const DSLTemplating = require('./templating.js');

const HttpExecutor = require('./executors/http-executor.js');
const JsExecutor = require('./executors/js-executor.js');

class DSLRunner {
	constructor() {
		/**
		 * In-memory store for session tokens, IDs, etc.
		 * Example: { 'checkpointLogin': <entire response object> }
		 */
		this.sessionStore = {};
		this.parser = new DSLParser();
		this.templating = new DSLTemplating(this.sessionStore);
		this.stepExecutors = [
			new HttpExecutor(this.templating),
			new JsExecutor(this.templating)
		]
		this.executionErrors = [];
		this.onStepStart = (step, pipeline, sessionStore) => {}
		this.onStepEnd = (step, pipeline, sessionStore) => {};
	}

	/**
	 * Executes the entire DSL pipeline
	 * @param {object} dsl - DSL object containing a "pipeline" array
	 */
	async execute(dsl) {
		const parsedDSL = this.parser.parse(dsl);
		this.executionErrors = [];

		for (const step of parsedDSL.pipeline) {
			try {
				this.onStepStart(step, parsedDSL.pipeline, this.sessionStore);
			} catch (error) {
				console.error(`Error in onStepStart for step "${step.name}":`, error.message);
			}

			try {
				await this.executeStep(step);
			} catch (error) {
				const stepError = {
					stepName: step.name,
					error: error.message,
					timestamp: new Date().toISOString()
				};
				this.executionErrors.push(stepError);

				console.error(`Error in step "${step.name}":`, error.message);

				if (!step.continueOnError) {
					console.error(`Pipeline execution stopped at step "${step.name}" due to error.`);
					throw new Error(`Pipeline execution failed at step "${step.name}": ${error.message}`);
				} else {
					console.warn(`Continuing execution despite error in step "${step.name}" (continueOnError=true)`);

					this.sessionStore[step.name] = {
						error: true,
						errorMessage: error.message,
						stepName: step.name,
						timestamp: stepError.timestamp
					};
				}
			}

			try {
				this.onStepEnd(step, parsedDSL.pipeline, this.sessionStore);
			} catch (error) {
				console.error(`Error in onStepStart for step "${step.name}":`, error.message);
			}
		}

		if (this.executionErrors.length > 0) {
			console.warn(`DSL pipeline execution complete with ${this.executionErrors.length} error(s).`);
		} else {
			console.log('DSL pipeline execution complete.');
		}
	}

  /**
   * Decides which executor will handle the step and calls it
   * @param {object} step - DSL step
   */
  async executeStep(step) {
    const executor = this.stepExecutors.find(e => e.canHandle(step));
    if (!executor) {
      throw new Error(
        `No executor found for step "${step.name}" with type="${step.type || 'http'}"`
      );
    }
    return executor.execute(step, this.sessionStore);
  }

	/**
	 * Clears the session store
	 */
	clearSession() {
		this.sessionStore = {};
		this.executionErrors = [];
	}

	/**
	 * Gets the current session store
	 * @returns {object} - Current session store
	 */
	getSessionStore() {
		return { ...this.sessionStore };
	}

	/**
	 * Gets the execution errors that occurred during the last run
	 * @returns {Array<object>} - Array of error objects
	 */
	getExecutionErrors() {
		return [...this.executionErrors];
	}

	/**
	 * Checks if the last execution had any errors
	 * @returns {boolean} - True if there were errors
	 */
	hasExecutionErrors() {
		return this.executionErrors.length > 0;
	}

	/**
	 * Validates all placeholders in a DSL before execution
	 * @param {object} dsl - DSL object to validate
	 * @returns {Array<string>} - Array of unresolvable placeholders
	 */
	validateDSLPlaceholders(dsl) {
		const parsedDSL = this.parser.parse(dsl);
		const unresolvable = [];

		for (const step of parsedDSL.pipeline) {
			unresolvable.push(...this.templating.validatePlaceholders(step.url));
			unresolvable.push(...this.templating.validateAllPlaceholders(step.body));
		}

		return unresolvable;
	}
}

module.exports = DSLRunner;