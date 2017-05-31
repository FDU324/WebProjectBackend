#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('server:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}


/**
 * socket.io
 */
var io = require('socket.io')(server);

var currentUsers = {};

var temNewFriendApply = [];

io.on('connection', (socket) => {
    console.log('a user connected: ' + socket.id);

    socket.on('confirmConnect', (data, func) => {
        //socket.emit('loginSuccess', 'success');
        func({
            success: true,
            data: 'success'
        });
    });

    socket.on('login', (username, func) => {
        currentUsers[username] = socket;
        //socket.emit('loginSuccess', 'success');
        func({
            success: true,
            data: 'success'
        });
        let applies = [];
        temNewFriendApply.forEach(apply => {
            if(apply.to === username){
                applies.push(apply.from);
            }
        });
        if(applies.length > 0){
            socket.emit('receiveNewFriendApply',JSON.stringify(applies));
        }
        console.log(username, ' login');
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('logout', (username, func) => {
        currentUsers[username] = null;
        func({
            success: true,
            data: 'success'
        });
        console.log(username, ' logout');
    });

    socket.on('newFriendApply', (data, func) => {
        let username = JSON.parse(data);
        console.log(currentUsers[username.friendUsername]);
        if (currentUsers[username.friendUsername]) {
            currentUsers[username.friendUsername].emit('receiveNewFriendApply', username.myUsername);
        } else {
            let temApply = {
                to: username.friendUsername,
                from: username.myUsername
            };
            temNewFriendApply.push(temApply);
            func({
                success: true,
                data: 'success'
            });
        }
    });


    socket.on('sendMessage', (data, func) => {
        let jsonData = JSON.parse(data);

        currentUsers[jsonData['to']].emit('receiveMessage', data);
        func({
                success: true,
                data: 'success'
            });
    });

});

//export {io, currentUsers};