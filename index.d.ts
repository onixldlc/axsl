declare module "axsl" {
  export interface DSL {
    pipeline: DSLStep[];
  }

  export interface DSLStep {
    name: string;
    type?: "http" | "js";
    method?: string;
    url?: string;
    code?: string | string[];
    body?: any;
    headers?: Record<string, string>;
    contentType?: string | null;
    onSuccess?: any;
    continueOnError?: boolean;
    allowSelfSignedSSL?: boolean;
  }

  export interface ExecutionError {
    stepName: string;
    error: string;
    timestamp: string;
  }

  export class DSLParser {
    parse(dsl: object): DSL;
    validateDSL(dsl: object): void;
    validateStep(step: object): void;
    normalizeDSL(dsl: object): DSL;
    normalizeStep(step: object): DSLStep;
  }

  export class DSLTemplating {
    constructor(sessionStore?: Record<string, any>);
    setSessionStore(sessionStore: Record<string, any>): void;
    replacePlaceholders(obj: any): any;
    replacePlaceholdersInString(str: string): string;
    getNestedValue(obj: Record<string, any>, path: string): any;
    validatePlaceholders(str: string): string[];
    validateAllPlaceholders(obj: any): string[];
  }

  export class DSLRunner {
    sessionStore: Record<string, any>;
    parser: DSLParser;
    templating: DSLTemplating;
    executionErrors: ExecutionError[];
    constructor();
    execute(dsl: DSL): Promise<void>;
    clearSession(): void;
    getSessionStore(): Record<string, any>;
    getExecutionErrors(): ExecutionError[];
    hasExecutionErrors(): boolean;
    validateDSLPlaceholders(dsl: DSL): string[];
  }

  export class HttpExecutor {
    constructor(templating: DSLTemplating);
    canHandle(step: DSLStep): boolean;
    execute(step: DSLStep, sessionStore: Record<string, any>): Promise<any>;
  }

  export class JsExecutor {
    constructor(templating: DSLTemplating);
    canHandle(step: DSLStep): boolean;
    execute(step: DSLStep, sessionStore: Record<string, any>): Promise<any>;
  }

  const DSLRunnerDefault: typeof DSLRunner;
  export default DSLRunnerDefault;
}