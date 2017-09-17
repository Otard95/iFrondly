/*jshint esversion: 6 */

var cmnds = require('./commands.js');

cmnds.add('test', ()=>{
  return 'test';
});

// test if command gets added
if (cmnds.exists('test')) {
  console.log('Test (add commands): Passed');
} else {
  console.log('Test (add commands): Failed');
  process.exit(0);
}

// test if command gives correct respense
if (cmnds.test() == 'test') {
  console.log('Test (function returns correct val): Passed');
} else {
  console.log('Test (function returns correct val): Failed');
  process.exit(0);
}

// test command formating
var formatedMsg = cmnds.formatMsg('!ping test');
if (formatedMsg.command != 'ping') {
  console.log('Test (format message): Failed - wrong command name');
  process.exit(0);
}
if (formatedMsg.params.length != 1) {
  console.log('Test (format message): Failed - wrong length of params');
  process.exit(0);
}
if (formatedMsg.params[0] != 'test') {
  console.log('Test (format message): Failed - wrong param');
  process.exit(0);
}
// Test Passed
console.log('Test (format message): Passed');

// test commands with params
cmnds.add('testWithParams', (val) => {
  return val;
});

if (cmnds.testWithParams('hello') != 'hello') {
  console.log('Test (command with param): Failed');
  process.exit(0);
}
// Test Passed
console.log('Test (command with param): Passed');

// test practical example
cmnds.add('ping', (msg) => {
  return 'Pong!' + msg;
});

var c = cmnds.formatMsg('!ping');

if(c.command != 'ping') {
  console.log('Test (practical example): Failed - wrong command name');
  process.exit(0);
}

if (cmnds.exists(c.command)) {
  if (cmnds[c.command]('msg') != 'Pong!msg') {
    console.log('Test (practical example): Failed - wrong return val');
    process.exit(0);
  }
}
// Test Passed
console.log('Test (practical example): Passed');
