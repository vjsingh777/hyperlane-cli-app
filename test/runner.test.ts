
// Create a Mocha instance
//const mocha = new Mocha();

// Add your test script to Mocha
mocha.addFile('test/search.test.ts');
mocha.addFile('test/dispatch.test.ts');

// Run the tests
mocha.run(function (failures) {
  process.exitCode = failures ? 1 : 0; // Set exit code based on test results
});
