const DSLRunner = require('../src/runner');
const defaultPath = "./sample.json";

(async () => {
  const fs = require('fs');
  
  var path = process.argv[2] || defaultPath;
  console.log(`using "${path}" as config path!`);
  
  if (!fs.existsSync(path)) {
    console.error(`File not found: ${path}`);
    process.exit(1);
  }
  
  const rawDSL = fs.readFileSync(path, 'utf8');
  const sampleDsl = JSON.parse(rawDSL);

  const runner = new DSLRunner();
  await runner.execute(sampleDsl);
  for (const step of sampleDsl.pipeline) {
    console.log(`Step "${step.name}" executed with result:`, runner.sessionStore[step.name]);
  }
})();