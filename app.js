#!/usr/bin/env node
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');

var index = require('./lib/routes/index');
var users = require('./lib/routes/users'); 
var moment = require('./lib/routes/moment');

var app = express();

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/user', users);
app.use('/moment', moment);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


/**
 * Module dependencies.
 */

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
});

module.exports = app;
