class DSLTemplating {
	constructor(sessionStore = {}) {
		this.sessionStore = sessionStore;
	}

	/**
	 * Sets the session store reference
	 * @param {object} sessionStore - Reference to the session store
	 */
	setSessionStore(sessionStore) {
		this.sessionStore = sessionStore;
	}

	/**
	 * Recursively replaces all placeholders in the given object.
	 * Example placeholder: {{checkpointLogin.data.sid}}
	 * @param {any} obj - Object to process for placeholder replacement
	 * @returns {any} - Object with placeholders replaced
	 */
	replacePlaceholders(obj) {
		if (typeof obj === 'string') {
			return this.replacePlaceholdersInString(obj);
		}
		if (typeof obj !== 'object' || obj === null) {
			return obj;
		}
		if (Array.isArray(obj)) {
			return obj.map(item => this.replacePlaceholders(item));
		}

		const replaced = {};
		for (const key of Object.keys(obj)) {
			replaced[key] = this.replacePlaceholders(obj[key]);
		}
		return replaced;
	}

	/**
	 * Replaces placeholders in a string with values from sessionStore.
	 * E.g. "https://example/{{checkpointLogin.data.sid}}"
	 * @param {string} str - String to process
	 * @returns {string} - String with placeholders replaced
	 */
	replacePlaceholdersInString(str) {
		if (typeof str !== 'string') return str;

		return str.replace(/{{(.*?)}}/g, (_match, capture) => {
			const pathParts = capture.trim().split('.');
			const stepName = pathParts.shift();

			const stepResponse = this.sessionStore[stepName];
			if (!stepResponse) {
				return '';
			}
			return this.getNestedValue(stepResponse, pathParts.join('.')) || '';
		});
	}

	/**
	 * Gets a nested value from an object using a path like "data.request.headers.someField"
	 * @param {object} obj - Object to traverse
	 * @param {string} path - Dot-notation path to the desired value
	 * @returns {any} - The value at the specified path, or undefined if not found
	 */
	getNestedValue(obj, path) {
		if (!path) return obj;
		const parts = path.split('.');
		let current = obj;
		for (const p of parts) {
			if (current && Object.prototype.hasOwnProperty.call(current, p)) {
				current = current[p];
			} else {
				return undefined;
			}
		}
		return current;
	}

	/**
	 * Validates that all placeholders in a string can be resolved
	 * @param {string} str - String to validate
	 * @returns {Array<string>} - Array of unresolvable placeholders
	 */
	validatePlaceholders(str) {
		if (typeof str !== 'string') return [];

		const unresolvable = [];
		const placeholders = str.match(/{{(.*?)}}/g) || [];

		for (const placeholder of placeholders) {
			const capture = placeholder.slice(2, -2).trim();
			const pathParts = capture.split('.');
			const stepName = pathParts.shift();

			if (!this.sessionStore[stepName]) {
				unresolvable.push(placeholder);
			} else {
				const value = this.getNestedValue(this.sessionStore[stepName], pathParts.join('.'));
				if (value === undefined) {
					unresolvable.push(placeholder);
				}
			}
		}

		return unresolvable;
	}

	/**
	 * Recursively validates all placeholders in an object
	 * @param {any} obj - Object to validate
	 * @returns {Array<string>} - Array of unresolvable placeholders
	 */
	validateAllPlaceholders(obj) {
		const unresolvable = [];

		const traverse = (item) => {
			if (typeof item === 'string') {
				unresolvable.push(...this.validatePlaceholders(item));
			} else if (Array.isArray(item)) {
				item.forEach(traverse);
			} else if (typeof item === 'object' && item !== null) {
				Object.values(item).forEach(traverse);
			}
		};

		traverse(obj);
		return unresolvable;
	}
}

module.exports = DSLTemplating;