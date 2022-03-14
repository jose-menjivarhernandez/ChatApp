
var socket = io();

/**
 * We first fetched all of the necessary elements in the HTML page to use them, add to them, etc
 */

var messages = document.getElementById('messages')  
var form = document.getElementById('form');
var input = document.getElementById('input');
var assignButton = document.getElementById('assign-username-btn');
var randomAssignButton = document.getElementById('random-btn');
var randomUserInfoList = document.getElementById('randomUserInfoList');
var modal2Body = document.getElementById('allnames');
var userList = document.getElementById('userList');
var submitBtn = document.getElementById('submitBtn');
var userForm = document.getElementById('userForm');
var validationMessage = document.getElementById('validationMessage');
var validationButton = document.getElementById('validationBtn');
var messagesContainer = document.getElementById('messagesContainer');
var membersGroup = document.getElementById('membersGroup');
var revertingDiv = document.getElementById('reversingDiv');

let socketId;
let username; 
let usercolor;

/**
 * We add an eventListener to the form to check when it has been submitted by the button or pressing enter
 * This event calls the userInputValidation function, which checks if the input is a valid name change, color change, or just a normal message
 * It then emits the appropriate events to the server depending on the case. Finally, cleans the text from the form. 
 */

form.addEventListener('submit', function(e) {
  e.preventDefault();
  let userInput = input.value;
  let userChangeObject;
  if (userInput) {
    let validationObject = userInputValidation(userInput);

    if(validationObject[0] == 'nameChange'){
      userChangeObject = [socketId, validationObject[1], username];
      socket.emit('Name change event', (userChangeObject));
    }
    else if (validationObject[0] == 'colorChange'){
      userChangeObject = [socketId, validationObject[1]]
      socket.emit('Color change event', userChangeObject);
    }
    else if (validationObject[0] == 'basicMessage') {
      let inputObject = [username, usercolor, input.value, socketId]
      socket.emit('chat message', inputObject);
    }
    input.value = '';
  }
});

/**
 * Event handler for when the server determines a desired name change was invalid (name already existed in chat)
 */

socket.on('Invalid name change', (potentialName) =>{
  alert('The username ' + potentialName + " is already being used. You cannot change your name to that");
});

/**
 * Event handler for whent he server determines a desired color change was invalid (color already being used in chat)
 */

socket.on('Invalid color change', (potentialColor) =>{
  alert('The username ' + potentialColor + " is already being used. You cannot change your name to that");
});

/**
 * Event handler changing the color of the client on a successful color change
 */
socket.on('Successful color change', (newColor)=>{
  usercolor = newColor;
})

/**
 * Event handler changing the username of the client on a successful name change
 */

socket.on('Successful name change', (newName)=>{
  username = newName;
})

/**
 * Event handler for when a client first connects and receives its socket ID from the server. Done for uniqueness purposes
 */

socket.on("Socket sending",(id) =>{
  console.log(id)
  socketId = id;
})


/**
 * Eventlistener for when a user submits its desired username and color through the "login"-like modal
 * emits the appropriate event for the server to verify whether the inputs are appropriate
 */

submitBtn.addEventListener('click', () => {
    let userArr = [userForm.elements[0].value, userForm.elements[1].value, socketId];
    socket.emit('send username&color', userArr)
});

/**
 * Event handler for when a user is recieving either confirmation or denial of their desired usernames and colors in the necessary modal
 * A response is appended to the modal as approriate
 */
socket.on('info validation check', (userObject)=>{
  validationMessage.innerHTML = '';
  let valMessage = document.createElement('p');
  let success = userObject[2];
  if(success){
    username = userObject[0];
    usercolor = userObject[1];
    valMessage.textContent = "Your username and colors have been set. You can go ahead";
    valMessage.style.color = 'green';
    validationMessage.appendChild(valMessage);
    validationButton.disabled = false;
  }
  else{
    valMessage.textContent = "You used some color or username already in use. Try again";
    valMessage.style.color = 'red';
    validationMessage.appendChild(valMessage);
  }
})


/**
 * This event handler essentially just completely updates the chat member list evert time a name changes, 
 * a user leaves, or enters the chat. 
 */
socket.on('New user change', (usernames)=> {
  membersGroup.innerHTML = '';
  let htmlMembersString;
  for(let i = 0; i< usernames.length;i++){
    htmlMembersString = `<li class="list-group-item" style = "overflow: auto;">${usernames[i]}</li>`
    membersGroup.insertAdjacentHTML('beforeend', htmlMembersString);
  }
});

/**
 * This event handler just adds a message to the chat when a new user has entered the chat, which also displays this new user's username
 * Not persisted on message history for new comers, just individuals in chat (since these are not messages, just notifications)
 */

socket.on('User entrance event', (aUsername) => {
  let htmlToAdd =`<p class = "text-muted" style = "align-self: center;">${aUsername} has entered the chat</p>`
  messagesContainer.insertAdjacentHTML('beforeend', htmlToAdd);
});

/**
 * This event handler just adds a message to the chat when a user has left the chat, which also displays this new user's username
 * Not persisted on message history for new comers, just individuals in chat (since these are not messages, just notifications)
 */
socket.on('User leaving event', (aUsername) => {
  let htmlToAdd =`<p class = "text-muted" style = "align-self: center;">${aUsername} has left the chat</p>`
  messagesContainer.insertAdjacentHTML('beforeend', htmlToAdd);
});

/**
 * This event handler just adds a message to the chat when a user has changed their name, which also displays this new user's username and the old one
 * Not persisted on message history for new comers, just individuals in chat (since these are not messages, just notifications)
 */

socket.on('User changing name event', (eventObject) => {
  let oldUsername = eventObject[0];
  let newUsername = eventObject[1];
  let htmlToAdd =`<p class = "text-muted" style = "align-self: center;">${oldUsername} has changed their name to ${newUsername}</p>`
  messagesContainer.insertAdjacentHTML('beforeend', htmlToAdd);
})

/**
 * Event listener on the button to choose your username and color in the main modal that emits an event 
 * to the server for the modal to get users' color and username information to be displayed in the decision modal
 */

assignButton.addEventListener('click', () =>{
    socket.emit('get users info', socketId)
});

/**
 * Event listener on the button to assign random username and colors to the user in the main modal.
 * This sends an event so the server finds a random username and color to assign
 */

randomAssignButton.addEventListener('click', () =>{
    socket.emit('random username request', (socketId));
});

/**
 * Event handler for the server's response when it sends back a random username and user color for the user to use, 
 * which then shows an alert with the user's information
 */
socket.on('random username response', (randomInputs) =>{
   username = randomInputs[0];
   usercolor = randomInputs[1];
   alert("Your username is now: " + randomInputs[0] + "\nYour user color is now: " + randomInputs[1]);
});

/**
 * Event handler for when the server sends back the information of all users (all usernames and user colors)
 * such that the decision modal displays them and the user does not pick a username of a person in the chat already
 */


socket.on('sent users info', (userInfo)=>{
    let usernamesArr = userInfo[0];
    let usercolorsArr = userInfo[1];
    let modal2 = document.createElement('h5');
    if(usernamesArr.length == 0){
        modal2.textContent = "No users in chat yet. You are free to choose any username and color";
        modal2Body.appendChild(modal2);
    }
    else{
      modal2.textContent = "The following usernames and their respective colors are in use, choose new ones:";
      modal2Body.appendChild(modal2);

      for(let i=0; i < usernamesArr.length; i++){
        var item = document.createElement('li');
        item.textContent = usernamesArr[i] + ": " + usercolorsArr[i];
        userList.appendChild(item);        
      }
    }
});

/**
 * Event handler for when the server sends a new user in the chat the enterity of the chat history (max 250 messages)
 * This does not include notidications of people leaving chat, entering, or changing names
 * The object received is the entire chat history (dates, users, and messages themselves)
 */

socket.on('Chat History', (chatHistory) =>{

    for(let i=0; i< chatHistory.length;i++){
      let username = chatHistory[i][0];
      let usercolor = chatHistory[i][1];
      let timestamp = chatHistory[i][2];
      let content = chatHistory[i][3];
      let htmlToAdd = createOutsiderCard(username, usercolor,timestamp,content);
      messagesContainer.insertAdjacentHTML("beforeend", htmlToAdd);
    }
});

/**
 * Event handler managing a new incoming message to the chat component. This checks whether we must create
 * A sender card (my card, on the right side) or another sender card, on the left side of the screen.
 * The received object has the messages username name, content, color, and timestamp
 */

socket.on('chat message', function(messageObject) {
  let username = messageObject[0];
  let usercolor = messageObject[1];
  let timestamp = messageObject[2];
  let content = messageObject[3];
  let senderSocket = messageObject[4]

  if(senderSocket == socketId){
    let htmlToAdd = createMySenderCard(username, usercolor, timestamp, content);
    messagesContainer.insertAdjacentHTML("beforeend", htmlToAdd);
  }
  else{
    let htmlToAdd = createOutsiderCard(username, usercolor,timestamp,content);
    messagesContainer.insertAdjacentHTML("beforeend", htmlToAdd);
  }
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  revertingDiv.scrollTop = revertingDiv.scrollHeight;
});

/**
 * 
 * @param {string} username 
 * @param {string} usercolor 
 * @param {string} timestamp 
 * @param {string} messageContent 
 * @returns The html component of the card object which shows the messages of other (not ourselves) users.
 */

function createOutsiderCard(username, usercolor, timestamp, messageContent){

  let htmlStub = `          <div class="card otherSenderCard my-2">
  <div class="card-header d-flex justify-content-between p-3" >
    <p class="fw-bold mb-0" id = "senderHeader" style = "color: ${usercolor}">${username}</p>
    <p class="text-muted small mb-0"> ${timestamp}</p>
  </div>
  <div class="card-body">
    <p class="mb-0">
      ${messageContent}
    </p>
  </div>
</div>
  `
  return htmlStub;
}

/**
 * 
 * @param {string} username 
 * @param {string} usercolor 
 * @param {string} timestamp 
 * @param {string} messageContent 
 * @returns The html component of the card object whcich shows our own messages. Slighlty different formatting
 */
function createMySenderCard(username, usercolor, timestamp, messageContent){

  let htmlStub = `          <div class="card mySenderCard my-2">
  <div class="card-header d-flex justify-content-between p-3" id = "cardHeader">
    <p class="fw-bold mb-0" id = "senderHeader" style = "color: ${usercolor};">${username}</p>
    <p class="text-muted small mb-0"> ${timestamp}</p>
  </div>
  <div class="card-body">
    <p class="mb-0 fw-bold">
      ${messageContent}
    </p>
  </div>
</div>
`
  return htmlStub;
}

/**
 * Function checks which type of message the sent message was
 * @param {string} inputString The string inputted as a message
 * @returns an object containing the type of message, could be a color change message, name change message, 
 * or normal message, as well as the message (could be the new color, new username)
 */
function userInputValidation(inputString){

  let nameChange = inputString.substring(0,7);
  let colorChange = inputString.substring(0,13);

  // I assume that color input is of hexadecimal form

  let trimmedString = inputString.trim(); 
  let lastChar = trimmedString.charAt(trimmedString.length-1);

  if(lastChar == '>'){
    if(nameChange == '/nick <'){
      let newName = trimmedString.substring(7,trimmedString.length-1)
      return ['nameChange', newName];
    }
    else if(colorChange =='/nickcolor <#'){
      let colorString = trimmedString.substring(13,trimmedString.length-1);
      if(/^[a-fA-F0-9]{1,6}$/.test(colorString)){
        return ['colorChange', '#' +colorString]
      }
      else{
        alert(`The color ${colorString} is not of the appropriate format. Try again. To change colort, type /nickcolor <#hexColor>. Remember that the hex Color code is comprised of a string of length 1 to 6 with characters only being letters from A-F and numbers from 0-9` )
        return ['wrongColorFormat',""]
      }
    }
  }
  return ['basicMessage', inputString]
}
