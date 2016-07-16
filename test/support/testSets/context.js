/*
 * cls-bluebird tests
 * Utilities
 * Functions to run a set of tests relating to testing that callbacks run in CLS context.
 * Mixin to Utils prototype.
 */

/* global describe */

// Exports

module.exports = {
	/**
	 * Run set of tests on a static method to ensure callback is always run in correct CLS context.
	 * Function `fn` should call the static method being tested and return resulting promise.
	 * `fn` is called with a `promise` and a `handler` function which should be attached as the callback to the method under test.
	 * e.g. `Promise.try(handler)`
	 *
	 * @param {Function} fn - Test function
	 * @param {Object} [options] - Options object
	 * @param {Function} [options.handler] - Handler function
	 * @param {Function} [options.preFn] - Handler function
	 * @returns {undefined}
	 */
	testSetCallbackContextStatic: function(fn, options) {
		var u = this;
		options = options || {};

		describe('callback runs in context', function() {
			u.testRunContext(function(handler, preResult, cb) {
				var p = fn(handler, preResult);
				cb(p);
			}, options.preFn, options.handler);
		});
	},

	/**
	 * Run set of tests on a prototype method to ensure callback is always run in correct CLS context.
	 * Function `fn` should take provided `promise` and call the method being tested on it and return resulting promise.
	 * `fn` is called with a `promise` and a `handler` function which should be attached as the callback to the method under test.
	 * e.g. `return promise.then(handler)`
	 *
	 * If handler is being attached to catch rejections, `options.catches` should be `true`
	 *
	 * @param {Function} fn - Test function
	 * @param {Object} options - Options object
	 * @param {boolean} options.continues - true if handler fires on resolved promise
	 * @param {boolean} options.catches - true if handler fires on rejected promise
	 * @param {boolean} options.passThrough - true if method passes through errors even if handler fires
	 * @param {Function} [options.handler] - Handler function
	 * @returns {undefined}
	 */
	testSetCallbackContextProto: function(fn, options) {
		var u = this;
		describe('callback runs in context on a promise', function() {
			u.describeMainPromisesAttach(function(makePromise, attach) {
				var handlerShouldBeCalled = u.getRejectStatus(makePromise) ? options.catches : options.continues;
				var expectedCalls = handlerShouldBeCalled ? 1 : 0;

				u.testRunContext(function(handler, p, cb) {
					attach(function() {
						var newP = fn(p, handler);
						if (options.passThrough || !handlerShouldBeCalled) u.inheritRejectStatus(newP, p);
						cb(newP);
					}, p);
				}, makePromise, options.handler, {expectedCalls: expectedCalls});
			});
		});
	},

	/**
	 * Run set of tests on a prototype method that chains onto a promise of an array
	 * to ensure callback is always run in correct CLS context.
	 * Function `fn` should take provided `promise` and call the method being tested on it with `handler`
	 * and return resulting promise.
	 * e.g. `return promise.map(handler)`
	 *
	 * If handler is being attached to catch rejections, `options.catches` should be `true`
	 *
	 * @param {Function} fn - Test function
	 * @param {Object} options - Options object
	 * @param {boolean} options.continues - true if handler fires on resolved promise
	 * @param {boolean} options.catches - true if handler fires on rejected promise
	 * @param {boolean} [options.noUndefinedValue=false] - true if method does not accept undefined value
	 * @param {boolean} [options.oneCallback=false] - true if callback should only be called once (`.spread()`)
	 * @param {Function} [options.handler] - Handler function
	 * @returns {undefined}
	 */
	testSetCallbackContextProtoArray: function(fn, options) {
		var u = this;
		describe('callback runs in context on a promise', function() {
			u.describeMainPromisesArrayAttach(function(makePromise, attach) {
				var handlerShouldBeCalled = u.getRejectStatus(makePromise) ? options.catches : options.continues;
				var expectedCalls = handlerShouldBeCalled ? (options.oneCallback ? 1 : 3) : 0;

				u.testRunContext(function(handler, p, cb) {
					attach(function() {
						var newP = fn(p, handler);
						if (!handlerShouldBeCalled) u.inheritRejectStatus(newP, p);
						cb(newP);
					}, p);
				}, makePromise, options.handler, {expectedCalls: expectedCalls});
			}, {noUndefined: options.noUndefinedValue});
		});
	}
};
