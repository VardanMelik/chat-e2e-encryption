const express = require('express');
const dotenv = require('dotenv');
const app = express();

const socket = require('socket.io');
const morgan = require('morgan');
const color = require('colors');
const cors = require('cors');

const { getCurrentUser, useLeave, useJoin, userJoin, userLeave } = require('./dummyuser');

// port
const port = 8000;

const server = app.listen(
    port,
    console.log(
        `Server is running in ${process.env.NODE_ENV} on port ${process.env.PORT}`
        .yellow.bold
    )
);

app.get('/', (req, res) => {
    res.json('Hello');
})

// initialized
const io = socket(server);

// everything related to io will go here
io.on('connection', (socket) => {
    //when new user join room
    socket.io('joinRoom', ( { username, roomname}) => {
        // create user
        const user = userJoin(socket.id, username, roomname);
        console.log(socket.id, "=id");
        socket.join(user.room);

        // emit message to user to welcome him/her
        socket.emit('message', {
            userId: user.id,
            username: user.username,
            text: `Welcome ${user.username}`
        });

        // Broadcast message to everyone except user that he has joined 
        socket.broadcast.to(user.room).emit('message', {
            userId: user.id,
            username: user.username,
            text: `${user.username} has joined the chat`
        })
    });

    //when somebody send text
    socket.on('chat', (text) => {
        // get user room and emit message
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', {
            userId: user.id,
            username: user.username,
            text: text
        });
    });

    //Disconnect, when user leave room
    socket.on('disconnect', () => {
        // delete user from users & emit that user has left the chat
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', {
                userId: user.id,
                username: user.username,
                text: `${user.username} has left the chat`
            })
        }
    })
})