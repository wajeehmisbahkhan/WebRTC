var callIds = {
    myId: '',
    otherId: ''
};

var socket = io.connect('http://localhost:3000');

socket.on('user came', addUser);
socket.on('set user id', setId);
socket.on('user left', removeUser);
socket.on('load previous users', addCurrentUsers);
socket.on('recieving call', respond);
socket.on('call recieved', startCall);

function addCurrentUsers (ids) {
    ids.forEach(id => {
        addUser(id);
    });
}

function addUser (id) {
    var userElement = '<div class="user nav nav-pills nav-fill bg-success" id="'+ id + '"><div class="info"><p>'+ id+'</p><form><input type="checkbox" value="Audio">Audio</input><input type="checkbox" value="Video">Video</input><input type="checkbox" value="Screen">Screen</input></form></div><div class="call"><button class="btn btn-primary">Call</button></div></div>';
    $("#users").append(userElement);
    //Prevent user from ticking both video and screen
    var form = $('div#'+id).find('form');
    form.click(preventDoubleScreen);
    form.parent().parent().find('button').click(callPerson);
}

function preventDoubleScreen (e) {
    var video = $(this).find('input:nth-child(2)')[0],
        screen = $(this).find('input:nth-child(3)')[0],
        target = $(e.target)[0];
    if (target === video) {
        if ($(screen).is(':checked'))
            $(screen).prop('checked', false);
    } else if (target == screen) {
        if ($(video).is(':checked'))
            $(video).prop('checked', false);
    }
}

function removeUser (id) {
    var user = $("body").find('div#'+id);
    user.remove();
}

function setId (id) {
    callIds.myId = id;
}

//WEBRTC STUFF
var peer;
var options = {video: false, audio: false};
var checked = {video: false, screen: false, audio: false};
var called = false;

function callPerson (e) {
    e.preventDefault();
    //Check kind of call
    var audio = $(e.target).parent().parent().find('input:first-child')[0],
        video = $(e.target).parent().parent().find('input:nth-child(2)')[0],
        screen = $(e.target).parent().parent().find('input:nth-child(3)')[0];
    
    checked.audio = $(audio).is(':checked');
    checked.video = $(video).is(':checked');
    checked.screen = $(screen).is(':checked');

    options.video = checked.screen || checked.video;
    options.audio = checked.audio;

    if (!(options.video || options.audio)) {
        alert('No options selected!');
        return;
    }
    //Get Callee ID
    var id = $(this).parent().parent().attr('id');
    callIds.otherId = id;

    //Call Screen
    $('#call-cover').css('display', 'flex');
    $('#call-screen').fadeIn();

    //Get the Checked Media
    getCheckedMedia(options).then(function (stream) {
        peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream: stream
        });

        peer.on('signal', function (data) { //Fired by Initiator
            if (!called) {
                called = true;
                socket.emit('calling', data, callIds);
            }
        });

        //Video Stream
        peer.on('stream', function (stream) { showCheckedMedia(stream) });

        //For Messages later
        peer.on('data', function (msg) {
            console.log(msg);
        })

        }).catch(function (err) {
            console.log(err);
        });

}

function respond (data, otherId) {
    //Caller ID
    callIds.otherId = otherId;

    //Confirmation Screen
    var confirmBox = $('#confirm-screen');
    $('#call-cover').css('display', 'flex');
    $('#caller-id').text(callIds.otherId);
    confirmBox.fadeIn();

    //Prevent Double Screen Response
    confirmBox.find('form').click(preventDoubleScreen);

    //Once it has been confirmed
    confirmBox.find('button').click(function (e) {
        e.preventDefault();
        //Check kind of reply
        var audio = confirmBox.find('input:first-child')[0],
        video = confirmBox.find('input:nth-child(2)')[0],
        screen = confirmBox.find('input:nth-child(3)')[0];

        checked.audio = $(audio).is(':checked');
        checked.video = $(video).is(':checked');
        checked.screen = $(screen).is(':checked');

        options.video = checked.screen || checked.video;
        options.audio = checked.audio;
        
        if (!(options.video || options.audio)) {
            alert('No options selected!');
            return;
        }

        //Call Screen
        confirmBox.hide();
        $('#call-cover').css('display', 'flex');
        $('#call-screen').fadeIn();
        //Get the checked media
        getCheckedMedia(options).then(function (stream) {
            peer = new SimplePeer({
                initiator: false,
                trickle: false,
                stream: stream
            });

            //First respond to the call
            peer.signal(data);

            //Send the Response to caller
            peer.on('signal', function (response) {
                socket.emit('responded', response, callIds.otherId);
            });

            //Video Stream
            peer.on('stream', function (stream) { showCheckedMedia(stream) });

            //Message
            peer.on('data', function (msg) {
                console.log(msg);
            })

            }).catch(function (err) {
                console.log(err);
            });
    });

}

function getCheckedMedia (options) {
    return navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        //Check if devices are available
        var cams = devices.filter(device => device.kind == "videoinput");
        var mics = devices.filter(device => device.kind == "audioinput");
        //Put in constraints to test against checked values
        var constraints = { video: cams.length > 0, audio: mics.length > 0 };
        
        if (checked.video) {
            //Video
            options.video = constraints.video && options.video;
            options.audio = constraints.audio && options.audio;
            return eval(navigator.mediaDevices.getUserMedia(options));
        } else if (checked.screen) {
            //Screen
            options.audio = constraints.audio && options.audio;
            if (navigator.getDisplayMedia) {
                return eval(navigator.getDisplayMedia(options));
            } else if (navigator.mediaDevices.getDisplayMedia) {
                return eval(navigator.mediaDevices.getDisplayMedia(options));
            } else {
                return eval(navigator.mediaDevices.getUserMedia({video: {mediaSource: 'screen'}, audio: options.audio}));
            }
        } else if (checked.audio) {
            //Audio Only
            options.audio = constraints.audio && options.audio;
            return eval(navigator.mediaDevices.getUserMedia(options));
        }
    })
}

function showCheckedMedia (stream) {
    //Call Container - Adjust Width Height
    var container = $('#call-container');
    //Append Stream
    if (options.video) {
        console.log("Video Started");
        var video = document.createElement('video');
        video.style.zIndex = 10;
        container.append(video);
        video.srcObject = stream;
        video.play();
    } else if (options.audio) {
        var audio = document.createElement('audio');
        audio.style.zIndex = 10;
        container.append(audio);
        audio.srcObject = stream;
        audio.play();
    }
}

//Acknowledge the response
function startCall (response) {
    peer.signal(response);
}