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


let messageHistory = []
let usernames = [];
let usercolors = [];
let socketIDs =[];

let usernumber =0;

io.on('connection', (socket) => {

    sendSocketID(socket.id);
    console.log(usernames)
    console.log(usercolors)
    console.log(socketIDs)

    // Sockett Disconnection event
    socket.on('disconnect', () => {
        let userIndex = socketIDs.indexOf(socket.id);
        let leavinguser = usernames[userIndex];
        usernames.splice(userIndex,1);
        usercolors.splice(userIndex,1);
        socketIDs.splice(userIndex,1);
        io.emit('New user change', usernames);
        io.emit('User leaving event', leavinguser);
    });

    // Dealing with chat messages
    socket.on('chat message', (messageObject)=>{
        let msg = messageObject[0];
        console.log('message: ' + msg)
    })

    socket.on('chat message',(messageObject)=>{
        let msgTime = calculateMessageTimestamp();
        let returnObject = [messageObject[0], messageObject[1], msgTime, messageObject[2], messageObject[3]]
        if(messageHistory.length >250){
            messageHistory.pop();
        }
        messageHistory.push(returnObject);
        io.emit('chat message', returnObject);
    });

    //Fetching users' information to assign usernames and such
    socket.on('get users info', ()=>{
        let userInfo = [usernames, usercolors];
        io.emit('sent users info', userInfo);
    });

    socket.on('send username&color' ,(userObject) =>{
        currentSocket = userObject[2];
        let returnObject = []
        if(!usernames.includes(userObject[0]) && !usercolors.includes(userObject[1])){
            returnObject = [userObject[0], userObject[1], true]
            io.to(currentSocket).emit('info validation check', returnObject);
            usernames.push(userObject[0]);
            usercolors.push(userObject[1]);
            io.emit('New user change', usernames);
            io.emit('User entrance event', userObject[0]);
        }
        else{
            returnObject = [userObject[0], userObject[1], false]
            io.to(currentSocket).emit('info validation check', returnObject);
        }
    });

    //Event to send back a random username to a user, 
    socket.on('random username request', (currentSocket)=>{
        randomCreations = generateRandomUsernameAndColor();
        usernames.push(randomCreations[0]);
        usercolors.push(randomCreations[1]);
        io.to(currentSocket).emit('random username response', randomCreations);
        io.emit('New user change', usernames);
        io.emit('User entrance event', randomCreations[0]);
    });

    socket.on('Name change event', (changeObject) => {
        let senderSocket = changeObject[0]
        let potentialNewName = changeObject[1];
        if(usernames.includes(potentialNewName)){
            io.to(senderSocket).emit('Invalid name change', potentialNewName)
        }
        else{
            let userIndex = socketIDs.indexOf(socket.id);
            usernames.splice(userIndex,1,potentialNewName);
            io.emit('New user change', usernames);
            io.to(senderSocket).emit('Successful name change', potentialNewName);
            let object2 = [changeObject[2], potentialNewName];
            io.emit('User changing name event', object2);
        }
    });

    socket.on('Color change event', (changeObject)=>{
        let senderSocket = changeObject[0]
        let potentialNewColor = changeObject[1];
        if(usercolors.includes(potentialNewColor)){
            io.to(senderSocket).emit('Invalid color change', potentialNewColor);
        }
        else{
            let userIndex = socketIDs.indexOf(socket.id);
            usercolors.splice(userIndex,1,potentialNewColor);
            io.to(senderSocket).emit('Successful color change', potentialNewColor);
        }
    });

})

server.listen(3001, () => {
    console.log("Listening at port 3001");
});

function sendSocketID(socketID){
    io.to(socketID).emit("Socket sending", socketID);
    io.to(socketID).emit("Chat History", messageHistory);
    socketIDs.push(socketID);
}

function generateRandomUsernameAndColor(){
    //source: https://css-tricks.com/snippets/javascript/random-hex-color/
    var randomUser = "user"+usernumber;
    var randomColor = Math.floor(Math.random()*16777215).toString(16);

    while(usernames.includes(randomUser) || usercolors.includes(randomColor)){
        usernumber+=1;
        var randomUser = "user"+usernumber;
        var randomColor = Math.floor(Math.random()*16777215).toString(16);
    }
    randomColor = "#" + randomColor;
    return [randomUser, randomColor];
}

function calculateMessageTimestamp(){
    var today = new Date();
    let timeOfDay = "AM";
    let hours = today.getHours();
    let minutes = today.getMinutes();
    let seconds = today.getSeconds();

    let minutesToUse = minutes < 10 ? ("0" + minutes):minutes;
    let secondsToUse = seconds < 10 ? ("0" + seconds):seconds;

    if(hours>12){
        hours = hours-12;
        timeOfDay = "PM"
    }
    time = hours+":"+minutesToUse+":"+secondsToUse+" "+timeOfDay;
    return time;
}