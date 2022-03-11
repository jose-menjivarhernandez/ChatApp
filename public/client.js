// import { usernamefunc, addUser, addColor} from "../index";

var socket = io();
  
var messages = document.getElementById('messages')  
var form = document.getElementById('form');
var input = document.getElementById('input');
var assignButton = document.getElementById('assign-username-btn');
var modal2Body = document.getElementById('allnames');
var userList = document.getElementById('userList');
var submitBtn = document.getElementById('submitBtn');
var userForm = document.getElementById('userForm');



form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});

//User Modal Implementation


submitBtn.addEventListener('click', () => {
    let userArr = [userForm.elements[0].value, userForm.elements[1].value];
    socket.emit('send username&color', userArr)
});

assignButton.addEventListener('click', () =>{
    socket.emit('get users info')
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


socket.on('chat message', function(msg) {
  var item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});