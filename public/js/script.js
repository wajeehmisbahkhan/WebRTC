var user = {
    id: ''
}

var socket = io.connect('http://localhost:3000');

socket.on('user came', addUser);
socket.on('user left', removeUser);
socket.on('load previous users', addCurrentUsers);

function addCurrentUsers (ids) {
    ids.forEach(id => {
        addUser(id);
    });
}

function addUser (id) {
    var userElement = '<div class="user '+ id + '"><div class="info"><p>'+ id+'</p></div><div class="call"><button>Call</button></div></div>';
    $("body").append(userElement);
}

function removeUser (id) {
    var user = $("body").find('div.'+id);
    user.remove();
}