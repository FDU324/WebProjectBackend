#!/usr/bin/env node
import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';

import {index} from './lib/routes/index';
import {users} from './lib/routes/users';
import {moment} from './lib/routes/moment';
import {upload} from './lib/routes/upload';

import {User, Friend, Moment, TemMessage, Comment} from './lib/connectors'
import {returnMoment} from './lib/util';

const app = express();

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/user', users);
app.use('/moment', moment);

app.use('/upload', upload);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
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
const debug = require('debug')('server:server');
import http from 'http';

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

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
    const port = parseInt(val, 10);

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

    const bind = typeof port === 'string'
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
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}


/**
 * socket.io
 */
const io = require('socket.io')(server);

let currentUsers = {};

io.on('connection', (socket) => {
    console.log('a user connected: ' + socket.id);

    socket.on('confirmConnect', (data, func) => {
        //socket.emit('loginSuccess', 'success');
        func({
            success: true,
            data: 'success'
        });
    });

    socket.on('reconfirm', (data, func) => {
        let username = JSON.parse(data).username;
        if (currentUsers[username]!==null) {
            currentUsers[username] = socket;
            console.log('reconnect:'+username);

            /*  处理离线信息  */
            TemMessage.findAll({
                where: {to: username},
                order: 'type'
            }).then(tems => {
                let allTemMessage = tems.map(tem => {
                    /*  离线好友请求  */
                    if (tem.type === 'friend') {
                        return User.findOne({
                            where: {username: tem.content}
                        }).then(user => {
                            return socket.emit('receiveFriendReq', JSON.stringify(user));
                        })
                    }
                    /*  离线聊天信息  */
                    else if (tem.type === 'message') {
                        return socket.emit('receiveMessage', tem.content);

                    }
                    /*  离线动态  */
                    else if (tem.type === 'moment') {
                        return returnMoment(tem.content, username).then(moment => {
                            return socket.emit('receiveMoment', JSON.stringify(moment));
                        });
                    }
                    /*  离线 赞  */
                    else if (tem.type === 'like') {
                        let temContent = JSON.parse(tem.content);
                        return returnMoment(temContent.id, username).then(moment => {
                            let temInfo = {
                                receiveMoment: moment,
                                changeTO: temContent.changeTO,
                                isOwner: temContent.isOwner
                            };
                            return socket.emit('receiveChangeLike', JSON.stringify(temInfo));
                        });
                    }
                    /*  离线 评论  */
                    else if (tem.type === 'comment') {
                        let temData = JSON.parse(tem.content);
                        let momentId = temData.id;
                        let showAlert = temData.showAlert;
                        let username = tem.to;
                        return returnMoment(momentId, username).then(receiveMoment => {
                            let temInfo = {
                                receiveMoment: receiveMoment,
                                showAlert: showAlert
                            };

                            return socket.emit('receiveComment', JSON.stringify(temInfo));
                        });
                    }
                    /*  离线好友确认  */
                    else if (tem.type === 'acceptFriend') {
                        return User.findOne({
                            where: {username: tem.content}
                        }).then(user => {
                            return socket.emit('friendReqAssent', JSON.stringify(user));
                        })
                    }

                });

                Promise.all(allTemMessage).then(data => {
                    console.log('temmessage broadcasted');

                    /*  删除已发送的离线信息  */
                    TemMessage.destroy({
                        where: {to: username}
                    }).then(() => {
                        console.log('temmessage deleted');
                    });
                });
            });
        }
            
        func({
            success: true,
            data: 'success'
        });
    });

    /*  登录  */
    socket.on('login', (username, func) => {
        /*  用户顶替  */
        if (currentUsers[username]!==null) {
            currentUsers[username].emit('logout');
        }
        
        currentUsers[username] = socket;
        func({
            success: true,
            data: 'success'
        });
        console.log(username, ' login');

        /*  处理离线信息  */
        TemMessage.findAll({
            where: {to: username},
            order: 'type'
        }).then(tems => {
            let allTemMessage = tems.map(tem => {
                /*  离线好友请求  */
                if (tem.type === 'friend') {
                    return User.findOne({
                        where: {username: tem.content}
                    }).then(user => {
                        return socket.emit('receiveFriendReq', JSON.stringify(user));
                    })
                }
                /*  离线聊天信息  */
                else if (tem.type === 'message') {
                    return socket.emit('receiveMessage', tem.content);

                }
                /*  离线动态  */
                else if (tem.type === 'moment') {
                    return returnMoment(tem.content, username).then(moment => {
                        return socket.emit('receiveMoment', JSON.stringify(moment));
                    });
                }
                /*  离线动态删除  */
                else if (tem.type === 'momentDelete') {
                    return socket.emit('deleteMoment', tem.content);
                }
                /*  离线 赞  */
                else if (tem.type === 'like') {
                    let temContent = JSON.parse(tem.content);
                    return returnMoment(temContent.id, username).then(moment => {
                        let temInfo = {
                            receiveMoment: moment,
                            changeTO: temContent.changeTO,
                            isOwner: temContent.isOwner
                        };
                        return socket.emit('receiveChangeLike', JSON.stringify(temInfo));
                    });
                }
                /*  离线 评论  */
                else if (tem.type === 'comment') {
                    let temData = JSON.parse(tem.content);
                    let momentId = temData.id;
                    let showAlert = temData.showAlert;
                    let username = tem.to;
                    return returnMoment(momentId, username).then(receiveMoment => {
                        let temInfo = {
                            receiveMoment: receiveMoment,
                            showAlert: showAlert
                        };

                        return socket.emit('receiveComment', JSON.stringify(temInfo));
                    });
                }
                /*  离线好友确认  */
                else if (tem.type === 'acceptFriend') {
                    return User.findOne({
                        where: {username: tem.content}
                    }).then(user => {
                        return socket.emit('friendReqAssent', JSON.stringify(user));
                    })
                }

            });

            Promise.all(allTemMessage).then(data => {
                console.log('temmessage broadcasted');

                /*  删除已发送的离线信息  */
                TemMessage.destroy({
                    where: {to: username}
                }).then(() => {
                    console.log('temmessage deleted');
                });
            });
        });

    });

    // 前台断开socket连接
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    // 登出
    socket.on('logout', (username, func) => {
        currentUsers[username] = null;
        func({
            success: true,
            data: 'success'
        });
        console.log(username, ' logout');
    });

    /*  好友请求  */
    socket.on('friendReq', (data, func) => {
        let username = JSON.parse(data);
        console.log(currentUsers[username.friendUsername]);
        if (currentUsers[username.friendUsername]) {
            User.findOne({
                where: {username: username.myUsername},
            }).then((user) => {
                currentUsers[username.friendUsername].emit('receiveFriendReq', JSON.stringify(user));
            }).catch((err) => {
                console.log('err:', err);
            });
        } else {
            /*  离线处理  */
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

    /*  同意好友请求  */
    socket.on('acceptFriendReq', (data, func) => {
        let username = JSON.parse(data);
        /*  数据库新建好友  */
        Friend.create({
            first: username.friendUsername,
            second: username.myUsername
        }).then(() => {
            func({
                success: true,
                data: 'success'
            });

            User.findOne({
                where: {username: username.myUsername},
            }).then((user) => {
                if (currentUsers[username.friendUsername]) {
                    currentUsers[username.friendUsername].emit('friendReqAssent', JSON.stringify(user));
                } else {
                    /*  离线处理  */
                    TemMessage.create({
                        to: username.friendUsername,
                        type: 'acceptFriend',
                        content: username.myUsername,
                    }).then(function () {
                        console.log('temp acceptFriend created');
                    });
                }
            })
        }).catch(err => {
            console.log('err:', err);
            func({
                success: false,
                data: err
            });
        });
    });

    /*  删除好友  */
    socket.on('deleteFriend', (data, func) => {
        let username = JSON.parse(data);
        /*  数据库删除好友  */
        Friend.destroy({
            where: {
                $or: [
                    {first: username.friendUsername, second: username.myUsername},
                    {first: username.myUsername, second: username.friendUsername}
                ]
            }
        }).then(() => {
            console.log("friend deleted " + username.myUsername);
            func({
                success: true,
                data: 'success'
            });
        }).catch(err => {
            console.log('err:', err);
            func({
                success: false,
                data: err
            });
        });
    });

    /*  聊天  */
    socket.on('sendMessage', (data, func) => {
        let jsonData = JSON.parse(data);

        Friend.findOne({
            where: {
                $or: [
                    {first: jsonData.to},
                    {second: jsonData.to}
                ]
            }
        }).then(friend => {
            if (friend==null) {
                socket.emit('refuseMessage', data);
                func({
                    success: true,
                    data: 'refuse'
                });
            }
            else {
                if (currentUsers[jsonData.to])
                    currentUsers[jsonData.to].emit('receiveMessage', data);
                else {
                    /*  离线处理  */
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
            }
        });
    });

    /*  新增动态  */
    socket.on('sendMoment', (data, func) => {
        let jsonData = JSON.parse(data);

        // 转为username
        let groupUsername = jsonData.group.map(member => {
            return member.username;
        });
        let likeUserUsername = jsonData.likeuser.map(member => {
            return member.username;
        });

        /*  数据库新增动态  */
        Moment.create({
            username: jsonData.user.username,
            type: jsonData.type,
            time: jsonData.time,
            location: JSON.stringify(jsonData.location),
            emotion: JSON.stringify(jsonData.emotion),
            group: JSON.stringify(groupUsername),
            text: jsonData.text,
            images: JSON.stringify(jsonData.images),
            likeuser: JSON.stringify(likeUserUsername)
        }).then(moment => {
            console.log('moment created.' + JSON.stringify(moment));
            func({
                success: true,
                data: 'success',
            });

            if (currentUsers[moment.username]) {    // 在线
                returnMoment(moment.id, moment.username).then(receiveMoment => {
                    currentUsers[moment.username].emit('receiveMoment', JSON.stringify(receiveMoment));
                });
            } else {      // 离线
                TemMessage.create({
                    to: moment.username,
                    type: "moment",
                    content: moment.id,
                }).then(() => {
                    console.log('temp moment created, broadcast to ' + moment.username);
                });
            }

            /*  通知好友  */
            if (moment.type==='public') {
                Friend.findAll({
                    where: {
                        $or: [
                            {first: jsonData.user.username},
                            {second: jsonData.user.username}
                        ]
                    }
                }).then(friends => {
                    // console.log('friends:', friends);
                    if (friends !== null) {
                        console.log('broadcast moment start');
                        for (let i = 0; i < friends.length; i++) {
                            let friend = (friends[i].first === jsonData.user.username) ? friends[i].second : friends[i].first;
                            if (currentUsers[friend]) {     // 在线
                                returnMoment(moment.id, friend).then(receiveMoment => {
                                    currentUsers[friend].emit('receiveMoment', JSON.stringify(receiveMoment));
                                    console.log('broadcast to ' + friend);
                                });
                            }
                            else {                      // 离线
                                TemMessage.create({
                                    to: friend,
                                    type: 'moment',
                                    content: moment.id,
                                }).then(() => {
                                    console.log('temp moment created, broadcast to ' + friend);
                                });
                            }
                        }
                    }
                });
            } else if (moment.type==='group') {
                let group = JSON.parse(moment.group);
                group.forEach(friend => {
                    if (currentUsers[friend]) {      // 在线
                        returnMoment(moment.id, friend).then(receiveMoment => {
                            // console.log(receiveMoment);
                            currentUsers[friend].emit('receiveMoment', JSON.stringify(receiveMoment));
                        });
                    } else {      // 离线
                        TemMessage.create({
                            to: friend,
                            type: 'moment',
                            content: moment.id,
                        }).then(() => {
                            console.log('temp moment created, broadcast to ' + friend);
                        });
                    }
                });
            }
            
        }).catch((err) => {
            console.log('failed: ' + err);
            func({
                success: false,
                data: err
            });
        });

    });

    /*  删除动态  */
    socket.on('deleteMoment', (data, func) => {
        let jsonData = JSON.parse(data);
        /*  数据库删除动态  */
        Moment.destroy({
            where: {id: jsonData.id}
        }).then(() => {
            console.log("moment deleted " + jsonData.id);
            if (currentUsers[jsonData.user.username]) {    // 在线
                currentUsers[jsonData.user.username].emit('deleteMoment', jsonData.id);
            } else {      // 离线
                TemMessage.create({
                    to: jsonData.user.username,
                    type: "momentDelete",
                    content: jsonData.id,
                }).then(() => {
                    console.log('temp moment delete created, broadcast to ' + jsonData.user.username);
                });
            }

            /*  通知好友  */
            if (jsonData.type==='public') {
                Friend.findAll({
                    where: {
                        $or: [
                            {first: jsonData.user.username},
                            {second: jsonData.user.username}
                        ]
                    }
                }).then(friends => {
                    // console.log('friends:', friends);
                    if (friends !== null) {
                        console.log('broadcast moment start');
                        for (let i = 0; i < friends.length; i++) {
                            let friend = (friends[i].first === jsonData.user.username) ? friends[i].second : friends[i].first;
                            if (currentUsers[friend]) {     // 在线
                                currentUsers[friend].emit('deleteMoment', jsonData.id);
                                console.log('broadcast to ' + friend);
                            }
                            else {                      // 离线
                                TemMessage.create({
                                    to: friend,
                                    type: 'momentDelete',
                                    content: jsonData.id,
                                }).then(() => {
                                    console.log('temp moment delete created, broadcast to ' + friend);
                                });
                            }
                        }
                    }
                });
            } else if (jsonData.type==='group') {
                let group = JSON.parse(jsonData.group);
                group.forEach(friend => {
                    if (currentUsers[friend]) {      // 在线
                        currentUsers[friend].emit('deleteMoment', jsonData.id);
                    } else {      // 离线
                        TemMessage.create({
                            to: friend,
                            type: 'momentDelete',
                            content: jsonData.id,
                        }).then(() => {
                            console.log('temp moment delete created, broadcast to ' + friend);
                        });
                    }
                });
            }
        }).catch(err => console.log('err:', err));

        func({
            success: true,
            data: 'success'
        });
    });

    // 赞
    socket.on('changeLike', (data, func) => {
        let jsonData = JSON.parse(data);
        let receiveMoment = jsonData.moment;
        let username = jsonData.username;
        let changeTO = jsonData.changeTO;

        // 查找动态
        Moment.findOne({
            where: {id: receiveMoment.id},
        }).then((moment) => {
            let users = JSON.parse(moment.likeuser);
            if (changeTO) {
                users.push(username);
            } else {
                let userIndex = users.indexOf(username);
                users.splice(userIndex, 1);
            }

            // 更新动态
            Moment.update({
                likeuser: JSON.stringify(users),
            }, {
                where: {id: moment.id}
            }).then((count) => {
                console.log('like changed.');
                // 通知发本动态的user
                if (currentUsers[moment.username]) {    // 在线
                    returnMoment(moment.id, moment.username).then(receiveMoment => {
                        // console.log(receiveMoment);
                        let temInfo = {
                            receiveMoment: receiveMoment,
                            changeTO: changeTO,
                            isOwner: true
                        };

                        // 自己给自己点赞，不需要提示count++
                        if (moment.username === username) {
                            temInfo.isOwner = false;
                        }

                        currentUsers[moment.username].emit('receiveChangeLike', JSON.stringify(temInfo));
                    });
                } else {      // 离线
                    let temInfo = {
                        id: moment.id,
                        changeTO: changeTO,
                        isOwner: true
                    };

                    TemMessage.create({
                        to: moment.username,
                        type: "like",
                        content: JSON.stringify(temInfo),
                    }).then(() => {
                        console.log('temp like created');
                    });
                }

                // 通知可见该动态的好友
                let type = moment.type;
                let group = JSON.parse(moment.group);

                if (type === 'public') {
                    Friend.findAll({
                        where: {
                            $or: [
                                {first: moment.username},
                                {second: moment.username}
                            ]
                        }
                    }).then((friends) => {
                        friends.forEach(friend => {
                            let temUsername = friend.first === moment.username ? friend.second : friend.first;
                            if (currentUsers[temUsername]) {      // 在线
                                returnMoment(moment.id, temUsername).then(receiveMoment => {
                                    // console.log(receiveMoment);
                                    let temInfo = {
                                        receiveMoment: receiveMoment,
                                        changeTO: changeTO,
                                        isOwner: false
                                    };
                                    currentUsers[temUsername].emit('receiveChangeLike', JSON.stringify(temInfo));
                                });
                            } else {      // 离线
                                let temInfo = {
                                    id: moment.id,
                                    changeTO: changeTO,
                                    isOwner: false
                                };

                                TemMessage.create({
                                    to: temUsername,
                                    type: "like",
                                    content: JSON.stringify(temInfo),
                                }).then(() => {
                                    console.log('temp like created');
                                });
                            }
                        });
                    }).catch(function (err) {
                        console.log('failed: ' + err);
                    });
                } else {        // 通知分组好友
                    group.forEach(friend => {
                            if (currentUsers[friend]) {      // 在线
                                returnMoment(moment.id, friend).then(receiveMoment => {
                                    // console.log(receiveMoment);
                                    let temInfo = {
                                        receiveMoment: receiveMoment,
                                        changeTO: changeTO,
                                        isOwner: false
                                    };
                                    currentUsers[friend].emit('receiveChangeLike', JSON.stringify(temInfo));
                                });
                            } else {      // 离线
                                let temInfo = {
                                    id: moment.id,
                                    changeTO: changeTO,
                                    isOwner: false
                                };

                                TemMessage.create({
                                    to: friend,
                                    type: "like",
                                    content: JSON.stringify(temInfo),
                                }).then(() => {
                                    console.log('temp like created');
                                });
                            }
                    });
                }

                func({
                    success: true,
                    data: 'success'
                });
            });
        }).catch((err) => {
            console.log('failed: ' + err);
            func({
                success: false,
                data: err
            });
        });

    });

    // 评论
    socket.on('comment', (data, func) => {
        let jsonData = JSON.parse(data);

        let actionType = jsonData.actionType;
        let databaseAction = new Promise((resolve, reject) => {
            if (actionType === 'create') {
                // 增加评论
                let tem = Comment.create({
                    momentId: jsonData.moment.id,
                    username: jsonData.username,
                    to: jsonData.to,
                    content: jsonData.content,
                    time: Date.now()
                }).then((count) => {
                    return 'success';
                }).catch((err) => {
                    console.log('moment create error', err);
                    return err;
                });

                resolve(tem);
            } else if (actionType === 'delete') {
                // 删除评论
                if(jsonData.comment.user.username !== jsonData.username){
                    resolve('error');
                }

                let tem = Comment.destroy({
                    where: {
                        id: jsonData.comment.id
                    },
                }).then((count) => {
                    console.log(count);
                    return 'success';
                }).catch((err) => {
                    console.log('moment delete error', err);
                    return err;
                });
                resolve(tem);
            } else {
                resolve('default');
            }
        });

        // 通知
        databaseAction.then(actionResult => {
            console.log(actionResult);

            if (actionResult !== 'success') {
                func({
                    success: false,
                    data: actionResult
                });
                return 'error';
            }

            func({
                success: true,
                data: 'success'
            });

            // 获取动态
            Moment.findOne({
                where: {id: jsonData.moment.id},
            }).then(moment => {
                // 通知发动态的用户，实际需要返回给前台的是整个包装后的moment，其他返回的数据是为了显示红点的具体内容（暂没做）
                if (currentUsers[moment.username]) {
                    returnMoment(moment.id, moment.username).then(receiveMoment => {
                        let temInfo = {
                            receiveMoment: receiveMoment,
                            showAlert: actionType==='create'
                        };

                        // 自己给自己评论，不需要提示count++
                        if (jsonData.moment.user.username === jsonData.username) {
                            temInfo.showAlert = false;
                        }

                        currentUsers[moment.username].emit('receiveComment', JSON.stringify(temInfo));
                    });
                } else {  // 离线
                    let temInfo = {
                        id: moment.id,
                        showAlert: true
                    };

                    TemMessage.create({
                        to: moment.username,
                        type: 'comment',
                        content: JSON.stringify(temInfo),
                    }).then(() => {
                        console.log('temp message: comment created');
                    }).catch((err) => {
                        console.log('failed: ' + err);
                    });
                }


                // 通知可见该动态的好友
                let type = moment.type;
                let group = JSON.parse(moment.group);

                if (type === 'public') {
                    Friend.findAll({
                        where: {
                            $or: [
                                {first: moment.username},
                                {second: moment.username}
                            ]
                        }
                    }).then((friends) => {
                        friends.forEach(friend => {
                            let temUsername = friend.first === moment.username ? friend.second : friend.first;
                            if (currentUsers[temUsername]) {      // 在线
                                returnMoment(moment.id, temUsername).then(receiveMoment => {
                                    // console.log(receiveMoment);
                                    let temInfo = {
                                        receiveMoment: receiveMoment,
                                        showAlert: false
                                    };

                                    // 评论的对象可以接收提醒
                                    if (jsonData.to !== '' && temUsername === jsonData.to) {
                                        temInfo.showAlert = true;
                                    }
                                    currentUsers[temUsername].emit('receiveComment', JSON.stringify(temInfo));
                                });
                            } else {      // 离线
                                let temInfo = {
                                    id: moment.id,
                                    showAlert: false
                                };
                                // 评论的对象可以接收提醒
                                if (jsonData.to !== '' && temUsername === jsonData.to) {
                                    temInfo.showAlert = true;
                                }

                                TemMessage.create({
                                    to: temUsername,
                                    type: "comment",
                                    content: JSON.stringify(temInfo),
                                }).then(() => {
                                    console.log('temp message: comment created');
                                });
                            }
                        });
                    }).catch((err) => {
                        console.log('failed: ' + err);
                    });
                } else {        // 通知分组好友
                    group.forEach(friend => {
                        if (currentUsers[friend]) {      // 在线
                            returnMoment(moment.id, friend).then(receiveMoment => {
                                // console.log(receiveMoment);
                                let temInfo = {
                                    receiveMoment: receiveMoment,
                                    showAlert: false
                                };
                                // 评论的对象可以接收提醒
                                if (jsonData.to !== '' && friend === jsonData.to) {
                                    temInfo.showAlert = true;
                                }

                                currentUsers[friend].emit('receiveComment', JSON.stringify(temInfo));
                            });
                        } else {      // 离线
                            let temInfo = {
                                id: moment.id,
                                showAlert: false
                            };
                            // 评论的对象可以接收提醒
                            if (jsonData.to !== '' && temUsername === jsonData.to) {
                                temInfo.showAlert = true;
                            }

                            TemMessage.create({
                                to: friend,
                                type: "comment",
                                content: JSON.stringify(temInfo),
                            }).then(() => {
                                console.log('temp message: comment created');
                            });
                        }
                    });
                }


            });
        }).catch(error=>{
            console.log(error);
        });
    });

});


module.exports = app;
