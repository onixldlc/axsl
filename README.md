# axsl

A configurable pipeline engine for executing API sequences using a domain-specific language (DSL). Define complex API workflows in JSON and execute them with built-in templating, error handling, and JavaScript code execution.

## Installation

```bash
# Install from GitHub
npm install github:onixldlc/axsl

# Or install from npm (when published)
npm install axsl
```

## Features

- HTTP requests with templating
- JavaScript code execution within pipelines
- Error handling with continue-on-error support
- Dependency injection for extensibility
- Session state management

## Basic Usage

### via script

```javascript
const DSLRunner = require('axsl');

// Define your own pipeline
const dsl = {
  pipeline: [
    {
      name: "login",
      method: "post",
      url: "https://api.example.com/login",
      body: { username: "user", password: "pass" }
    },
    {
      name: "getProfile",
      method: "get",
      url: "https://api.example.com/profile/{{login.data.userId}}",
      continueOnError: true
    },
    {
      name: "customLogic",
      type: "js",
      code: [
        "// Process data from previous steps",
        "const userId = sessionStore.login.data.userId;", 
        "return { processed: true, userId };",
      ]
    }
  ]
};

// Run the pipeline
async function run() {
  const runner = new DSLRunner();
  await runner.execute(dsl);
  console.log(runner.getSessionStore());
}

run();
```

### via terminal
```bash
# Create your json pipeline
touch ./sample.json
npm run

# Or load the json pipeline from another folder
npm run \<path/to/fiel\>
```

## API Documentation

### DSLRunner

The main class for executing DSL pipelines.

```javascript
const runner = new DSLRunner();
await runner.execute(dslObject);
```

### Step Types

#### HTTP Steps

```javascript
{
  "name": "stepName",
  "method": "get|post|put|delete|patch",
  "url": "https://example.com/api",
  "body": { /* request body */ },
  "continueOnError": false
}
```

#### JavaScript Steps

```javascript
{
  "name": "jsStep",
  "type": "js",
  "code": "return { result: 'value' };",
  "continueOnError": false
}
```

## License

MIT