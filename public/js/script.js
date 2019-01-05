var user = {
    id: 'Ammar'
}



function addUser (data) {
    var userElement = '<div class="user '+ data.id + '"><div class="info"><p>'+ data.id+'</p></div><div class="call"><button>Call</button></div></div>';
    $("body").append(userElement);
}

function removeUser (data) {
    var user = $("body").find('div.'+data.id);
    user.remove();
}