// node:test runs registered suites at process exit, without child-process isolation.
require('./wake-style.test.cjs');
require('./wake-integration.test.cjs');
require('./backend-regression.test.cjs');
