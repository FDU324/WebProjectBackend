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

import {User, Friend, Moment, TemMessage} from './lib/connectors'

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
    TemMessage.findAll({
      where: { to: username },
      order: 'type'
    }).then(tem => {
      for (let i=0; i<tem.length; i++) {
        if (tem[i].type === 'friend')
          socket.emit('receiveNewFriendApply',tem[i].content);
        else if (tem[i].type === 'message')
          socket.emit('receiveNewMessage',tem[i].content);
        else if (tem[i].type === 'moment')
          socket.emit('receiveNewMoment',tem[i].content);
      }
    })
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
      TemMessage.create({
        to: username.friendUsername,
        type: 'friend',
        content: username.myUsername,
      }).then(function () {
        console.log('temp friend created');
      }).catch(function (err) {
        console.log('failed: ' + err);
      });
    }
    func({
      success: true,
      data: 'success'
    });
  });

  socket.on('sendMessage', (data, func) => {
    let jsonData = JSON.parse(data);

    if (currentUsers[jsonData.to])
      currentUsers[jsonData.to].emit('receiveMessage', data);
    else {
      TemMessage.create({
        to: jsonData.to,
        type: 'message',
        content: data,
      }).then(function () {
        console.log('temp message created');
      }).catch(function (err) {
        console.log('failed: ' + err);
      });
    }
    func({
      success: true,
      data: 'success'
    });
  });
  
  socket.on('sendMoment', (data, func) => {
    let jsonData = JSON.parse(data);

    /*  create Moment  */
    Moment.create({
      username: jsonData.username,
      type: jsonData.type,
      time: jsonData.time,
      location: jsonData.location,
      emotion: jsonData.emotion,
      group: (jsonData.group==undefined) ? null : jsonData.group,
      text: (jsonData.text==undefined) ? null: jsonData.text,
      images: (jsonData.images==undefined) ? null : jsonData.images,
      likeuser: jsonData.likeuser
    }).then(moment => {
      console.log('moment created.' + JSON.stringify(moment));

      /*  find user's friends and inform them of the new moment  */
      Friend.findAll({
        where: {
          $or: [
            { first: jsonData.username },
            { second: jsonData.username }
          ]
        }
      }).then(friends => {
        if (friends !== null) {
          console.log('broadcast moment start');
          for (let i=0; i<friends.length; i++) {
            let friend = (friends[i].first===jsonData.username) ? friends[i].second : friends[i].first;
            if (currentUsers[friend])
              currentUsers[friend].emit('receiveMoment', JSON.stringify(moment));
            else {
              TemMessage.create({
                to: jsonData.to,
                type: 'moment',
                content: JSON.stringify(moment),
              }).then(function () {
                console.log('temp moment created');
              });
            }
            console.log('broadcast to'+friend);
          }
        }
      });

    }).catch(function (err) {
      console.log('failed: ' + err);
    });

    func({
      success: true,
      data: 'success'
    });
  })

});

module.exports = app;
