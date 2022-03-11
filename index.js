const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io")
const io = new Server(server)


app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

let usernames = [];
let usercolors = [];

io.on('connection', (socket) => {
    console.log('a user connected');

    // Sockett Disconnection event
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    // Dealing with chat messages
    socket.on('chat message', (msg)=>{
        console.log('message: ' + msg)
    })

    socket.on('chat message',(msg)=>{
        io.emit('chat message', msg);
    });

    //Fetching users' information to assign usernames and such
    socket.on('get users info', ()=>{
        let userInfo = [usernames, usercolors];
        io.emit('sent users info', userInfo)
    })

    socket.on('send username&color' ,(userObject) =>{
        usernames.push(userObject[0]);
        console.log(usernames);
        usercolors.push(userObject[1]);
        console.log(usercolors);
    });
})

server.listen(3001, () => {
    console.log("Listening at port 3001");
});



// export const usernamefunc = () => {
//     return usernames;
// }

// export const usercolorfunc = () => {
//     return usercolors;
// }

// export const addUser = (user) => {
//     usernames = usernames.push(user);
//     console.log(usernames)
// }

// export const addColor = (color) => {
//     usercolors = usercolors.push(color);
//     console.log(usercolors)
// }

