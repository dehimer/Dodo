requirejs.config({
    urlArgs: "bust=" +  (new Date()).getTime(),
    baseUrl: './',
    paths: {
        // 'use': '../libs/use',
        'underscore': 'libs/underscore', // AMD support
        'backbone': 'libs/backbone-min', // AMD support
        'd3': 'libs/d3.v3.min'
    },
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: ["underscore"],
            exports: "Backbone"
        },
        d3: {
            exports: 'd3'
        },
        d3time: {
            deps: ['d3']
        }
    },
    name: 'main',
    out: 'main-build.js',
    waitSeconds: 40
});

// alert(' ')
require([
	'libs/domReady',
	'modules/app'
], function (domReady, app) {
    // alert('!')
	domReady(function () {
        // alert('!!')
        app.start();
    });
})