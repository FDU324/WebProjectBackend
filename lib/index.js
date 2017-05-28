import express from 'express';
import http from 'http';
import io from 'socket.io';

const app = express();
const server = http.Server(app);
const socketio = io(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});

let currentUsers = {};

socketio.on('connection', (socket) => {
    console.log('a user connected: ' + socket.id);

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('login', (username, func) => {
        currentUsers[username] = socket;
        //socket.emit('loginSuccess', 'success');
        func({
            success: true,
            data: 'success'
        });
    });

    socket.on('sendMessage', (from, to, message, func) => {
        currentUsers[to].emit('receiveMessage', from, message, () => {
            func();
        });
    });



});






