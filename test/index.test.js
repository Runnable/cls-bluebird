/*
 * cls-bluebird tests
 */

// TODO: multiple handlers on same promise

/* global describe, it */

// Imports
var chai = require('chai'),
	expect = chai.expect,
	_ = require('lodash');

// Init chai
chai.config.includeStack = true;

// Create CLS namespace
var ns = require('./ns');

// Get bluebird versions to be tested
var versions = require('./versions')(ns);

// Get methods to be tested
var methods = require('./methods');

// Run all tests in series
runAllTests(versions, methods);

/**
 * Run tests on all bluebird versions and all methods.
 * @param {Array} versions - Array of Bluebird versions to test against
 * @param {Array} methods - Array of methods to test
 * @returns {undefined}
 */
function runAllTests(versions, methods) {
	versions.forEach(function(versionParams) {
	    describe(versionParams.name, function() {
	        _.forIn(methods, function(methodParams, methodName) {
				['ctor', 'proto'].forEach(function(methodType) {
	                if (methodParams.methodType !== 'both' && methodParams.methodType !== methodType) return;
	                var isProto = (methodType === 'proto');

	                describe('Promise.' + (methodType === 'proto' ? 'prototype.' : '') + methodName, function() {
	                    if (methodParams.tests) {
	                        methodParams.tests.forEach(function(methodParams) {
	                            describe(methodParams.name, function() {
	                                runTests(methodName, isProto, methodParams, versionParams);
	                            });
	                        });
	                    } else {
	                        runTests(methodName, isProto, methodParams, versionParams);
	                    }
	                });
	            });
	        });
	    });
	});
}

/**
 * Run tests for specific method and bluebird version
 * @param {string} methodName - Method name
 * @param {boolean} isProto - true if is a prototype method, false if static method
 * @param {Object} methodParams - Method parameters
 * @param {string} versionName - Name of bluebird version
 * @param {Object} versionParams - Parameters for this bluebird version
 * @returns {undefined}
 */
function runTests(methodName, isProto, methodParams, versionParams) {
    // skip bluebird versions where method not present
	if (methodParams.versions && !Array.isArray(methodParams.versions)) methodParams.versions = [methodParams.versions];
	if (methodParams.versions && methodParams.versions.indexOf(versionParams.name) === -1) return;

    if (methodParams.paramType === 'value') {
        runTestsValue(methodName, isProto, methodParams, versionParams.Promise, versionParams.ctors);
    } else {
        runTestsFunction(methodName, isProto, methodParams, versionParams.Promise, versionParams.ctors);
    }
}

/**
 * Run tests on method called with value (literal or promise)
 * @param {string} methodName - Method name
 * @param {boolean} isProto - true if is a prototype method, false if static method
 * @param {Object} methodParams - Method parameters
 * @param {Function} Promise - Promise implementation
 * @param {Array} ctors - Array of promise constructors
 * @returns {undefined}
 */
function runTestsValue(methodName, isProto, methodParams, Promise, ctors) {
	var obj = (isProto ? Promise.resolve() : Promise),
		method = obj[methodName].bind(obj);

    if (methodParams.reject) {
		runTestsValueReject(method, Promise);
	} else {
		runTestsValueResolve(method, Promise, ctors);
	}
}

/**
 * Run tests on method called with literal value where will return resolved promise.
 * Tested in a variety of CLS context combinations.
 *
 * @param {Function} method - Method function
 * @param {Function} Promise - Promise implementation
 * @returns {undefined}
 */
function runTestsValueLiteralResolve(method, Promise) {
	runTestValueSingleLiteral(method, 1, addThenHandlerResolve, Promise);
}

/**
 * Run tests on method called with literal value or promise where will return resolved promise.
 * Tested with:
 *   - Literal value
 *   - Resolved promise
 *   - Rejected promise
 *
 * Resolved/rejected promises are tested with:
 *   - Promises made from each of promise constructors
 *   - Promises resolved/rejected synchronously and asynchonously
 *
 * All cases are tested in a variety of CLS context combinations
 *
 * @param {Function} method - Method function
 * @param {Function} Promise - Promise implementation
 * @param {Array} ctors - Array of promise constructors
 * @returns {undefined}
 */
function runTestsValueResolve(method, Promise, ctors) {
	describe('literal value', function() {
		runTestsValueLiteralResolve(method, Promise);
    });

    ctors.forEach(function(ctor) {
        var ThisPromise = ctor.Promise;

		// Skip promise implementations not present (e.g. native promise on Node v0.10)
		if (!ThisPromise) {
			it(ctor.name);
			return;
		}

		describe(ctor.name, function() {
			[{
				name: 'resolved',
				value: 1,
				addThenHandler: addThenHandlerResolve,
				sync: resolveSync,
                async: resolveAsync
			},
			{
				name: 'rejected',
				value: new Error('Rejection'),
				addThenHandler: addThenHandlerReject,
				sync: rejectSync,
                async: rejectAsync
			}].forEach(function(params) {
				describe(params.name, function() {
					['sync', 'async'].forEach(function(syncName) {
						var resolver = params[syncName],
							addThenHandler = params.addThenHandler,
							value = params.value;

						describe(syncName, function() {
							[false, true].forEach(function(loseContext) {
								var makeValue = function() {
									return resolver(ThisPromise, value);
								};
								if (loseContext) makeValue = wrapRunInContext(makeValue);

								describe('context ' + (loseContext ? 'lost' : 'retained'), function() {
									runTestValueSingle(method, value, makeValue, addThenHandler, Promise);
				                });
							});
						});
					});
				});
			});
        });
    });
}

/**
 * Run tests on method called with error object where will return rejected promise.
 * Tested in a variety of CLS context combinations.
 *
 * @param {Function} method - Method function
 * @param {Function} Promise - Promise implementation
 * @returns {undefined}
 */
function runTestsValueReject(method, Promise) {
	runTestValueSingleLiteral(method, new Error('Rejection'), addThenHandlerReject, Promise);
}

/**
 * Run tests on method called with function which may return value or promise.
 * @param {string} methodName - Method
 * @param {boolean} isProto - true if is a prototype method, false if static method
 * @param {Object} testParams - Test parameters
 * @param {Function} Promise - Promise implementation
 * @param {Array} ctors - Array of promise constructors
 * @returns {undefined}
 */
function runTestsFunction(methodName, isProto, testParams, Promise, ctors) { // jshint ignore:line
    it('function');
}

/**
 * Run test for defined value (literal only, no promise) in various CLS context combinations.
 * @param {Function} method - Method function
 * @param {*} value - Value promise to be resolved/rejected with
 * @param {Function} addThenHandler - Function to add a `.then()` handler to the promise
 * @param {Function} Promise - Promise implementation
 * @returns {undefined}
 */
function runTestValueSingleLiteral(method, value, addThenHandler, Promise) {
	var makeValue = function() {return value;};
	runTestValueSingle(method, value, makeValue, addThenHandler, Promise);
}

/**
 * Run test for defined value (or promise of a value) in various CLS context combinations.
 * @param {Function} method - Method function
 * @param {*} value - Value promise to be resolved/rejected with
 * @param {Function} makeValue - Function to make the value to be passed to method (which can be a promise which resolves/rejects to `value`)
 * @param {Function} addThenHandler - Function to add a `.then()` handler to the promise
 * @param {Function} Promise - Promise implementation
 * @returns {undefined}
 */
function runTestValueSingle(method, value, makeValue, addThenHandler, Promise) {
	itMultiple('no context', function(cb) {
		var promise = method(makeValue());
		addThenHandler(promise, value, null, Promise, cb);
	});

	itMultiple('promise creation and then in same context', function(cb) {
		runInContext(function(ctx) {
			var promise = method(makeValue());
			addThenHandler(promise, value, ctx, Promise, cb);
		});
	});

	itMultiple('promise creation and then in different contexts', function(cb) {
		var promise = runInContext(function() {
			return method(makeValue());
		});

		runInContext(function(ctx) {
			addThenHandler(promise, value, ctx, Promise, cb);
		});
	});

	itMultiple('promise creation in no context, then in context', function(cb) {
		var promise = method(makeValue());

		runInContext(function(ctx) {
			addThenHandler(promise, value, ctx, Promise, cb);
		});
	});

	itMultiple('promise creation in context, then in no context', function(cb) {
		var promise = runInContext(function() {
			return method(makeValue());
		});

		addThenHandler(promise, value, null, Promise, cb);
	});

	itMultiple('promise creation in context, then in nested context', function(cb) {
		runInContext(function() {
			var promise = method(makeValue());

			runInContext(function(ctx) {
				addThenHandler(promise, value, ctx, Promise, cb);
			});
		});
	});
}

/**
 * Set of functions to create promises which resolve or reject either synchronously or asynchonously.
 */
function resolveSync(Promise, value) {
    return new Promise(function(resolve) {
        resolve(value);
    });
}

function resolveAsync(Promise, value) {
    return new Promise(function(resolve) {
        setImmediate(function() {
            resolve(value);
        });
    });
}

function rejectSync(Promise, err) {
    return new Promise(function(resolve, reject) { // jshint ignore:line
        reject(err);
    });
}

function rejectAsync(Promise, err) {
    return new Promise(function(resolve, reject) { // jshint ignore:line
        setImmediate(function() {
            reject(err);
        });
    });
}

/**
 * Add final then handler to a promise, expecting promise to resolve.
 * Upon resolution of promise, calls callback function.
 *
 * Calls callback with error if any of:
 *   - promise is not instance of Promise implementation provided
 *   - promise is rejected
 *   - then handler executed async and not bound to correct CLS context
 *   - then handler bound more than once
 *   - then handler executed sync and has been unnecessarily bound
 *   - then handler executed within wrong CLS context
 *
 * @param {Promise} promise - Promise to chain onto
 * @param {*} expectedValue - Value expect promise to be resolved with
 * @param {Object} ctx - CLS context expect promise to be bound to
 * @param {Function} Promise - Promise implementation (e.g. Bluebird v2, Bluebird v3)
 * @param {Function} cb - Callback function (node-style arguments)
 * @returns {Promise} - New promise with then handler attached
 */
function addThenHandlerResolve(promise, expectedValue, ctx, Promise, cb) {
	// check promise is instance of the main Promise constructor
	if (!(promise instanceof Promise)) return cb(new Error('Promise returned is not instance of main bluebird constructor'));

	// attach final `.then()` to promise
	var sync = true;

	var resolveFn = function(value) {
		toCallback(function() {
			expect(value).to.equal(expectedValue);
			checkContext(resolveFn, ctx, sync);
		}, cb);
	};
	var rejectFn = function(err) {
		cb(err);
	};

	promise = promise.then(resolveFn, rejectFn);
	sync = false;

	return promise;
}

/**
 * Add final then handler to a promise, expecting promise to be rejected.
 * Upon rejection of promise, calls callback function.
 *
 * Calls callback with error if any of:
 *   - promise is not instance of Promise implementation provided
 *   - promise is resolved
 *   - promise is rejected with any error other than that expected
 *   - then handler executed async and not bound to correct CLS context
 *   - then handler bound more than once
 *   - then handler executed sync and has been unnecessarily bound
 *   - then handler executed within wrong CLS context
 *
 * @param {Promise} promise - Promise to chain onto
 * @param {Error} expectedErr - Error expect promise to be rejected with
 * @param {Object} ctx - CLS context expect promise to be bound to
 * @param {Function} Promise - Promise implementation (e.g. Bluebird v2, Bluebird v3)
 * @param {Function} cb - Callback function (node-style arguments)
 * @returns {Promise} - New promise with then handler attached
 */
function addThenHandlerReject(promise, expectedErr, ctx, Promise, cb) {
	// check promise is instance of the main Promise constructor
	if (!(promise instanceof Promise)) return cb(new Error('Promise returned is not instance of main bluebird constructor'));

	// attach final `.then()` to promise
	var sync = true;

	var resolveFn = function() {
		cb(new Error('Should have been rejected'));
	};
	var rejectFn = function(err) {
		toCallback(function() {
			if (err !== expectedErr) throw err;
			checkContext(resolveFn, ctx, sync);
		}, cb);
	};

	promise = promise.then(resolveFn, rejectFn);
	sync = false;

	return promise;
}

/**
 * Checks that function has been bound to and executed in correct CLS context.
 * Should be called from within function itself.
 * If function has been called synchronously, throws if was bound.
 * If function has been called asynchonously, throws if any of:
 *   - function was not bound
 *   - function was bound more than once
 *   - function was bound to wrong context
 * Sync or async, throws if executed within wrong context.
 *
 * @param {Function} fn - Function to check binding of
 * @param {Object} ctx - CLS context expecting function to have been bound to and executed within
 * @param {boolean} sync - true if executing synchronously, false if async
 * @returns {undefined} - If all is well
 * @throws {Error} - If any of above problems encountered
 */
function checkContext(fn, ctx, sync) {
	var bound = fn._bound;

	if (sync) {
		if (bound) throw new Error('Callback was unnecessarily bound as was called syncronously');
	} else {
		if (!bound) throw new Error('Callback was not bound');
		if (bound.length > 1) throw new Error('Callback was bound multiple times');
		if (bound[0] !== ctx) throw new Error('Callback was bound to wrong context');

	}

	if (!compareContexts(ns.active, ctx)) throw new Error('CLS context lost');
}

/**
 * Compare two contexts for equality.
 * `null` is considered same as an empty context object with no prototype.
 * @param {Object} ctx - CLS context object
 * @param {Object} ctxExpected - CLS context object expected
 * @returns {boolean} - true if same, false if not
 */
function compareContexts(ctx, ctxExpected) {
	if (ctx === ctxExpected) return true;
	if (ctxExpected === null && Object.getPrototypeOf(ctx) === null && !Object.getOwnPropertyNames(ctx).length) return true;
	return false;
}

/**
 * Run function and pass return value/thrown error to node-style callback function.
 * If function returns a value, this is passed to callback is 2nd arg.
 * If function throws an error, this is passed to callback as 1st arg.
 *
 * @param {Function} fn - Function to execute
 * @param {Function} cb - Callback function to call with result
 * @returns {undefined}
 */
function toCallback(fn, cb) {
	var result;
	try {
		result = fn();
	} catch (err) {
		cb(err);
		return;
	}
	cb(null, result);
}

/**
 * Create a CLS context and run function within it.
 * Context is created with a unique `_id` attribute within it.
 * `fn` is called with the CLS context object as argument.
 *
 * @param {Function} fn - Function to execute within context
 * @returns {*} - Return value of `fn()`
 */
var nextId = 1;
function runInContext(fn) {
    return runAndReturn(function(ctx) {
        var id = nextId;
        ns.set('_id', id);
        nextId++;

        return fn(ctx);
    });
}

/**
 * Wraps function to run it within a new CLS context.
 * Context is created with a unique `_id` attribute within it.
 * `fn` is called with original `this` context and arguments as wrapped function.
 *
 * @param {Function} fn - Function to execute within context
 * @returns {Function} - Function that runs `fn` within a new CLS context
 */
function wrapRunInContext(fn) {
	return function() {
		var self = this,
			args = arguments;
		return runInContext(function() {
			return fn.apply(self, args);
		});
	};
}

/**
 * Creates CLS context and runs a function within it.
 * Like `ns.run(fn)` but returns the return value of `fn` rather than the context object.
 * `fn` is called with the CLS context object as argument.
 *
 * @param {Function} fn - Function to execute within context
 * @returns {*} - Return value of `fn()`
 */
function runAndReturn(fn) {
	var value;
    ns.run(function(ctx) {
        value = fn(ctx);
    });
    return value;
}

/**
 * Same as mocha's `it()` but runs the test in parallel multiple times.
 * If all test runs pass, executes callback with no error.
 * If any test runs fail, executes callback with first error thrown.
 * Waits for all test runs to complete before calling callback, even if an error is thrown.
 * Test functions are passed `cb` argument which must be called at end of test run.
 * Ignores promises returned from test function - callbacks only.
 *
 * @param {string} name - Name of test
 * @param {Function} fn - Test function
 * @returns {undefined}
 */
var ROUNDS = 3;
function itMultiple(name, fn) {
	it(name, function(cb) {
		// throw if CLS context is not empty at start
		if (ns.active !== null) throw new Error('CLS context not empty at start of test');

		// run `fn` multiple times
		var done = callbackAggregator(ROUNDS, cb);

		for (var i = 0; i < ROUNDS; i++) {
			try {
				fn.call(this, done);
			} catch (err) {
				done(err);
			}
		}
    });
}

/**
 * Make a callback function which calls superior callback when it's been called a number of times.
 * If called with no errors on any occasion, calls callback with no error.
 * If called with an error on any occasion, executes callback with first error.
 * Waits to be called expected number of times before calling callback, even if receives an early error.
 * (i.e. does not call superior callback immediately on receipt of an error)
 *
 * @param {number} numCallbacks - Number of times expects callback to be called
 * @param {Function} cb - Superior callback to be called with aggregate result
 * @returns {Function} - Callback function
 */
function callbackAggregator(numCallbacks, cb) {
	var err;

	return function(thisErr) {
		if (thisErr && !err) err = thisErr;
		numCallbacks--;
		if (!numCallbacks) cb(err);
	};
}
