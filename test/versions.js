/*
 * cls-bluebird tests
 * Bluebird versions to test
 */

// Imports
var Bluebird2 = require('bluebird2'),
    Bluebird3 = require('bluebird3'),
    clsBluebird = require('../shim');

// Exports
module.exports = function(ns) {
    // Patch bluebird2 + bluebird3
    var PatchedBluebird2 = Bluebird2.getNewLibraryCopy();
    clsBluebird(ns, PatchedBluebird2);
    var PatchedBluebird3 = Bluebird3.getNewLibraryCopy();
    //clsBluebird(ns, PatchedBluebird3);

    // Return bluebird versions to test
    // `ctrs` property contains array of promise constructors to use for chaining from
    // e.g. with `Promise.resolve(promise)`
    return [
        {
            name: 'bluebird2',
            Promise: PatchedBluebird2,
            ctors: [
                {name: 'bluebird v2 patched', Promise: PatchedBluebird2},
                {name: 'bluebird v2 unpatched', Promise: Bluebird2},
                {name: 'bluebird v3 patched', Promise: PatchedBluebird3},
                {name: 'bluebird v3 unpatched', Promise: Bluebird3},
                {name: 'native promise', Promise: global.Promise}
            ]
        }/*,
        {
            name: 'bluebird3',
            Promise: PatchedBluebird3,
            ctors: [
                {name: 'bluebird v3 patched', Promise: PatchedBluebird3},
                {name: 'bluebird v3 unpatched', Promise: Bluebird3},
                {name: 'bluebird v2 patched', Promise: PatchedBluebird2},
                {name: 'bluebird v2 unpatched', Promise: Bluebird2},
                {name: 'native promise', Promise: global.Promise}
            ]
        }*/
    ];
};
