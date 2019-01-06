var data = {
    callerId: '',
    calleeId: ''
}

var socket = io.connect('http://localhost:3000');

socket.on('user came', addUser);
socket.on('set user id', setId);
socket.on('user left', removeUser);
socket.on('load previous users', addCurrentUsers);
socket.on('recieving call', respond);

function addCurrentUsers (ids) {
    ids.forEach(id => {
        addUser(id);
    });
}

function addUser (id) {
    var userElement = '<div class="user" id="'+ id + '"><div class="info"><p>'+ id+'</p></div><div class="call"><button>Call</button></div></div>';
    $("body").append(userElement);
    $('button').click(callPerson);
}

function removeUser (id) {
    var user = $("body").find('div#'+id);
    user.remove();
}

function setId (id) {
    data.callerId = id;
}

function callPerson (e) {
    //Add a basic video and screen place to the body
    e.preventDefault();
    var id = $(this).parent().parent().attr('id');
    data.calleeId = id;
    $('body').html('<p>Calling...</p>');
    socket.emit('calling', data);
}

function respond (data) {
    console.log(data);
}