const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io")
const io = new Server(server)

/**
 * Code necessary such that the client knows whether to get the htl file
 * as well as for the pap to beware that it must use code in the public fodler.
 */

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

/**
 * Data structures to hold all messages,usernames, user colors, and user socket IDs
 */

let messageHistory = []
let usernames = [];
let usercolors = [];
let socketIDs =[];

// Number that will allow to have unique usernames when randomly assigned ("user+usernumber")
let usernumber =0;

/**
 * All event handlers for when there is a connection to server
 */
io.on('connection', (socket) => {

    // we call the sendSocketID function to send the joiner their socker ID as well as the entire chat history
    socketInitialization(socket.id);

    /**
     * Socket disconnection event handler. Essentially, this just finds the leaving user's username to remove it
     * from the list and and then sends the apporpriate events to all the clients to adapt their screens
     */
    socket.on('disconnect', () => {
        let userIndex = socketIDs.indexOf(socket.id);
        let leavinguser = usernames[userIndex];
        usernames.splice(userIndex,1);
        usercolors.splice(userIndex,1);
        socketIDs.splice(userIndex,1);
        io.emit('New user change', usernames);
        if(leavinguser != null){
            io.emit('User leaving event', leavinguser);
        }
    });

    /**
     * Chat message event handler that essentially just adds a message to the message history object. This
     * handler ensures that the message history is at most 200 events only. 
     * This then emits the chat message to all clients to adapt their screen
     */
    socket.on('chat message',(messageObject)=>{
        let msgTime = calculateMessageTimestamp();
        let returnObject = [messageObject[0], messageObject[1], msgTime, messageObject[2], messageObject[3]]
        if(messageHistory.length >250){
            messageHistory.pop();
        }
        messageHistory.push(returnObject);
        io.emit('chat message', returnObject);
    });

    /**
     * Event handler that sends all usernames and users to the asking client. Identified by socket id
     */
    socket.on('get users info', (thisSocketID)=>{
        let userInfo = [usernames, usercolors];
        io.to(thisSocketID).emit('sent users info', userInfo);
    });

    /**
     * Event handler that handles when the user wants to set their color and username in the initial modal.
     * This essentially checks whether the desired uusername and color are available, and emits the appropriate events in that case 
     * they are and even when they are not
     */
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

    //Event hander to send back a random username to a user when it was requested in the "login"-like modals.
    //Uses a helper function described blow
    socket.on('random username request', (currentSocket)=>{
        randomCreations = generateRandomUsernameAndColor();
        usernames.push(randomCreations[0]);
        usercolors.push(randomCreations[1]);
        io.to(currentSocket).emit('random username response', randomCreations);
        io.emit('New user change', usernames);
        io.emit('User entrance event', randomCreations[0]);
    });

    /**
     * Event handler to check whether a name change event is valid. If its not, the error
     * is emmitted only to the changing client. If successful, is broadcasted to all users such that
     * they add it to their member lists and notify their message screens
     */
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

    /**
     * Event handler for when a user wants to change colors. If successful, invalid error event sent only
     * to changing client. If successful, success event sent to client to update their own colors. 
     */

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

/**
 * Server listening at port 3001
 */
server.listen(3001, () => {
    console.log("Listening at port 3001");
});

/**
 * Function to initialize a socket, such that a socket has its own ID, and has the chat history in its screen
 * @param {string} socketID current socket ID to send to client so cient can store it and use it to identify itself
 */

function socketInitialization(socketID){
    io.to(socketID).emit("Socket sending", socketID);
    io.to(socketID).emit("Chat History", messageHistory);
    socketIDs.push(socketID);
}

/**
 * Function used to generate a random username and color
 * @returns an object comprised of the generated random username and color
 */
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

/**
 * Utility function to calculation current timestamp
 * @returns current timestamp calculation down to seconds 
 * Adding the 0s if seconds and minutes under 10 and also and AM PM where necessary
 */
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