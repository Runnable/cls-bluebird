/*
 * cls-bluebird tests
 * Methods to test
 */

// Imports
var _ = require('lodash');

/*
 * Define methods to be tested
 *
 * For each method:
 * methodType: Whether method is on Promise constructor or prototype or both
 *   'ctor': On constructor only e.g. `Promise.resolve()`
 *   'proto': On prototype only e.g. `Promise.prototype.then()`
 *   'both': On both e.g. `Promise.all()` and `Promise.prototype.all()` (default)
 *
 * paramType: Whether method takes a value, or function
 *   'value': Takes a value e.g. `Promise.resolve()`
 *   'function': Takes a function e.g. `Promise.prototype.then()` (default)
 *
 * reject: TODO fill this in
 */
var methods = {
    resolve: {
        methodType: 'ctor',
        paramType: 'value'
    },
    reject: {
        methodType: 'ctor',
        paramType: 'value',
        reject: true
    },
    then: {
        methodType: 'proto',
        tests: [
            {
                name: 'resolved'
            },
            {
                name: 'rejected',
                reject: true,
                paramIndex: 1
            }
        ]
    },
    catch: {
        methodType: 'proto',
        reject: true
    }/*,
    all: {
        paramType: 'value',
        array: true
    }*/
};

// Fill in default options
_.forIn(methods, function(method) {
    _.defaults(method, {
        methodType: 'both',
        paramType: 'function',
        reject: false,
        paramIndex: 0
        //versions: undefined
    });
});

// Export methods
module.exports = methods;
