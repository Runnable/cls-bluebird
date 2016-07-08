/*
 * cls-bluebird tests
 * Tests for .error()
 */

// Imports
var runTests = require('../support');

// Run tests

runTests('.error()', function(u) {
	// NB In bluebird v3 handler is not bound.
	// `.error()` calls `.catch()` synchronously which calls `.then()` synchronously but with proxy handler.
	// No way to test for binding.
	u.testSetProtoMethodAsyncHandler(function(p, handler) {
		return p.error(handler);
	}, {catches: true, noUndefined: true, noBindTest: (u.bluebirdVersion === 3)});
});
