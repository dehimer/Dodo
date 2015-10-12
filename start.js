var http = require('http')
var static = require('node-static');
var io = require('socket.io');

var file = new static.Server('./public');

var server = http.createServer(function (request, response) {

    console.log(request.headers);

    request.addListener('end', function () {

        if(request.url == '/')
        {
            file.serveFile('/index.html', 200, {}, request, response);
        }
        else
        {
            file.serve(request, response, function (e, res) {
                if (e && (e.status === 404)) {
                    file.serveFile('/not-found.html', 404, {}, request, response);
                }
            });
        }


    }).resume();
}).on('error', function (error) {
    console.log(error);
}).listen(1308);

var sockets = io.listen(server).set('log level', 1).set('close timeout',60).set('transports', ['websocket']);