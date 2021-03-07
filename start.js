// Run this for quick startup
// for debug run each service seprately

const { userInfo } = require("os");
console.log(userInfo());

// This will execute all the Services needed for running Ubair
// More Info on README
const exec = require("child_process").exec;

function runService(runthis) {
  const myShellScript = exec(runthis);

  myShellScript.stdout.on("data", (data) => {
    console.log(data);
  });
  myShellScript.stderr.on("data", (data) => {
    console.error(data);
  });
}
// Running Authentication Service
// PORT : 1336
runService("cd Auth/ && npm run dev");

// Running Location Service
// PORT : 1337
runService("cd Content/ && npm run dev");

// Running Profile Service
// PORT : 1338
runService("cd User/ && npm run dev");
