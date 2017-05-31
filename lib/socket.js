/**
 * Created by kadoufall on 2017/5/29.
 */
import {io, currentUsers} from '../bin/www';

io.on('connection', (socket) => {
    console.log('a user connected: ' + socket.id);

    socket.on('confirmConnect',(data, func)=>{
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



    socket.on('sendMessage', (from, to, message, func) => {
        currentUsers[to].emit('receiveMessage', from, message, () => {
            func();
        });
    });
});