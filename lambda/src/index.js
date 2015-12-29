'use strict';

var http = require('http');

var options = require('./options');

var AlexaSkill = require('./AlexaSkill');
var EchoSonos = function () {
    AlexaSkill.call(this, options.appid);
};

var STATE_RESPONSES = [
    "This is $currentTitle by $currentArtist",
    "We're listening to $currentTitle by $currentArtist",
    "$currentTitle by $currentArtist"
];

EchoSonos.prototype = Object.create(AlexaSkill.prototype);
EchoSonos.prototype.constructor = EchoSonos;



EchoSonos.prototype.intentHandlers = {
    // register custom intent handlers
    PlayIntent: function (intent, session, response) {
        console.log("PlayIntent received");
        options.path = '/preset/' + encodeURIComponent(intent.slots.Preset.value);
        httpreq(options, function() {
            response.tell("OK");
        });
    },

    PlaylistIntent: function (intent, session, response) {
        console.log("PlaylistIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/playlist/' + encodeURIComponent(intent.slots.Preset.value);
        httpreq(options, function() {
            response.tell("OK");
        });
    },

    FavoriteIntent: function (intent, session, response) {
        console.log("FavoriteIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/favorite/' + encodeURIComponent(intent.slots.Preset.value);
        httpreq(options, function() {
            response.tell("OK");
        });
    },

    ResumeIntent: function (intent, session, response) {
        console.log("ResumeIntent received");
        options.path = '/resumeall';
        httpreq(options, function() {
            response.tell("OK");
        });
    },

    PauseIntent: function (intent, session, response) {
        console.log("PauseIntent received");
        options.path = '/pauseall';
        httpreq(options, function() {
            response.tell("OK");
        });
    },

    VolumeDownIntent: function (intent, session, response) {
        console.log("VolumeDownIntent received");
        volumeHandler(intent.slots.Room.value, response, '-10');
    },

    VolumeUpIntent: function (intent, session, response) {
        console.log("VolumeUpIntent received");
        volumeHandler(intent.slots.Room.value, response, '+10');
    },

    SetVolumeIntent: function (intent, session, response) {
        console.log("SetVolumeIntent received");
        volumeHandler(intent.slots.Room.value, response, intent.slots.Percent.value);
    },

    NextTrackIntent: function (intent, session, response) {
        console.log("NextTrackIntent received");

        actOnCoordinator(options, '/next', intent.slots.Room.value,  function (responseBodyJson) {
            response.tell("OK");
        });
    },

    PreviousTrackIntent: function (intent, session, response) {
        console.log("PreviousTrackIntent received");
        actOnCoordinator(options, '/previous', intent.slots.Room.value,  function (responseBodyJson) {
            response.tell("OK");
        });
    },

    WhatsPlayingIntent: function (intent, session, response) {
        console.log("WhatsPlayingIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/state';

        httpreq(options, function (responseJson) {
            responseJson = JSON.parse(responseJson);
            
            var randResponse = Math.floor(Math.random() * STATE_RESPONSES.length);
            
            var responseText = STATE_RESPONSES[randResponse].replace("$currentTitle", responseJson.currentTrack.title).replace("$currentArtist", responseJson.currentTrack.artist);

            response.tell(responseText);
        });
    },

    MuteIntent: function (intent, session, response) {
        console.log("MuteIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/mute';
        httpreq(options, function() {
            response.tell("OK");
        });
    },

    UnmuteIntent: function (intent, session, response) {
        console.log("UnmuteIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/unmute';
        httpreq(options, function() {
            response.tell("OK");
        });
    },

    ClearQueueIntent: function (intent, session, response) {
        console.log("ClearQueueIntent received");
        actOnCoordinator(options, '/clearqueue', intent.slots.Room.value,  function (responseBodyJson) {
            response.tell("OK");
        });
    },

    RepeatIntent: function (intent, session, response) {
        console.log("RepeatIntent received");
        toggleHandler(intent.slots.Room.value, intent.slots.Toggle.value, "repeat", response);
    },

    ShuffleIntent: function (intent, session, response) {
        console.log("ShuffleIntent received");
        toggleHandler(intent.slots.Room.value, intent.slots.Toggle.value, "shuffle", response);
    },

    CrossfadeIntent: function (intent, session, response) {
        console.log("CrossfadeIntent received");
        toggleHandler(intent.slots.Room.value, intent.slots.Toggle.value, "crossfade", response);
    },
}

/** Handles all skills of the form /roomname/toggle/[on,off] */
function toggleHandler(roomValue, toggleValue, skillName, response) {
    if (!toggleValue || (toggleValue != 'on' && toggleValue != 'off')) {
        response.tell("I need to know if I should turn  " + skillName + " on or off. Example: Alexa, tell Sonos to turn " + skillName + " on");
        return;
    }

    options.path = '/' + encodeURIComponent(roomValue) + '/' + skillName + '/' + toggleValue;

    httpreq(options, function() {
        response.tell("Turned " + skillName + " " + toggleValue + " in " + roomValue);
    });
}

/** Handles up, down, & absolute volume for either an individual room or an entire group */
function volumeHandler(roomValue, response, volume) {
    var roomAndGroup = parseRoomAndGroup(roomValue);

    if (!roomAndGroup.room) {
        response.tell("Please specify a room. For example, turn the volume down in the KITCHEN");
        return;
    }

    if (!roomAndGroup.group) {
        options.path = '/' + encodeURIComponent(roomAndGroup.room) + '/volume/' + volume;

        httpreq(options, function() {
            response.tell("OK");
        });
    }

    else {
        actOnCoordinator(options, '/groupVolume/' + volume, roomAndGroup.room,  function (responseBodyJson) {
            response.tell("OK");
        });
    }
}

/* Given a string roomArgument that either looks like "my room" or "my room group",
 * returns an object with two members:
 *   obj.group: true if roomArgument ends with "group", false otherwise.
 *   obj.room: if roomArgument is "my room group", returns "my room"
 */
function parseRoomAndGroup(roomArgument) {
    var roomAndGroupParsed = new Object();
    roomAndGroupParsed.group = false;
    roomAndGroupParsed.room = false;

    if (!roomArgument) {
        return roomAndGroupParsed;
    }

    var groupIndex = roomArgument.indexOf("group");

    if (groupIndex && (groupIndex + 4 == (roomArgument.length - 1)) && roomArgument.length >= 7) {
        roomAndGroupParsed.group = true;
        roomAndGroupParsed.room = roomArgument.substr(0, groupIndex - 1);
    }
    else {
        roomAndGroupParsed.room = roomArgument;
    }

    return roomAndGroupParsed;
}

function httpreq(options, responseCallback) {
  console.log("Sending HTTP request to: " + options.path);

  http.request(options, function(httpResponse) {
      var body = '';
      
      httpResponse.on('data', function(data) {
          body += data;
      });
      
      httpResponse.on('end', function() {
          responseCallback(body);
      });
  }).end();
}

// 1) grab /zones and find the coordinator for the room being asked for
// 2) perform an action on that coordinator 
function actOnCoordinator(options, actionPath, room, onCompleteFun) {
    options.path = '/zones';
    console.log("getting zones...");

    var handleZonesResponse = function (responseJson) {
        responseJson = JSON.parse(responseJson);
        var coordinatorRoomName = findCoordinatorForRoom(responseJson, room);
        options.path = '/' + encodeURIComponent(coordinatorRoomName) + actionPath;
        console.log(options.path);
        httpreq(options, onCompleteFun);
    }

    httpreq(options, handleZonesResponse);
}

// Given a room name, returns the name of the coordinator for that room
function findCoordinatorForRoom(responseJson, room) {
    console.log("finding coordinator for room: " + room);
    
    for (var i = 0; i < responseJson.length; i++) {
        var zone = responseJson[i];

        for (var j = 0; j < zone.members.length; j++) {
            var member = zone.members[j];

            if (member.roomName.toLowerCase() == room.toLowerCase()) {
                return zone.coordinator.roomName;
            }
        }
    }
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the EchoSonos skill.
    var echoSonos = new EchoSonos();
    echoSonos.execute(event, context);
};
