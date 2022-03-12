

var socket = io();
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

let socketId;
let username; 
let usercolor;

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    let inputObject = [username, usercolor, input.value, socketId]
    socket.emit('chat message', inputObject);
    input.value = '';
  }
});

socket.on("Socket sending" ,(id) =>{
  console.log(id)
  socketId = id;
})

//User Modal Implementation

submitBtn.addEventListener('click', () => {
    let userArr = [userForm.elements[0].value, userForm.elements[1].value, socketId];
    socket.emit('send username&color', userArr)
});

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

socket.on('New user addon', (usernames)=> {
  membersGroup.innerHTML = '';
  for(let i = 0; i< usernames.length;i++){
    let htmlMembersString = `<li class="list-group-item">${usernames[i]}</li>`
    membersGroup.insertAdjacentHTML('beforeend', htmlMembersString);
  }

});

assignButton.addEventListener('click', () =>{
    socket.emit('get users info')
});

randomAssignButton.addEventListener('click', () =>{
    socket.emit('random username request', (socketId));
});

socket.on('random username response', (randomInputs) =>{
   username = randomInputs[0];
   usercolor = randomInputs[1];
   alert("Your username is now: " + randomInputs[0] + "\nYour user color is now: " + randomInputs[1]);
});


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
  window.scrollTo(0, document.body.scrollHeight);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});


function createOutsiderCard(username, usercolor, timestamp, messageContent){

  let htmlStub = `          <div class="card otherSenderCard my-2">
  <div class="card-header d-flex justify-content-between p-3">
    <p class="fw-bold mb-0" style = "color: ${usercolor}">${username}</p>
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

function createMySenderCard(username, usercolor, timestamp, messageContent){

  let htmlStub = `          <div class="card mySenderCard my-2">
  <div class="card-header d-flex justify-content-between p-3">
    <p class="fw-bold mb-0" style = "color: ${usercolor};">${username}</p>
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