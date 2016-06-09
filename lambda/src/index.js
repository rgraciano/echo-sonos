'use strict';

var http = require('http');
var https = require('https');

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
        options.path = '/preset/' + encodeURIComponent(intent.slots.Preset.value.toLowerCase());
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    },

    PlaylistIntent: function (intent, session, response) {  
        console.log("PlaylistIntent received");
        playlistHandler(intent.slots.Room.value, intent.slots.Preset.value, 'playlist', response);
    },

    FavoriteIntent: function (intent, session, response) {
        console.log("FavoriteIntent received");
        playlistHandler(intent.slots.Room.value, intent.slots.Preset.value, 'favorite', response);
    },

    ResumeAllIntent: function (intent, session, response) {
        console.log("ResumeAllIntent received");
        options.path = '/resumeall';
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    },

    ResumeIntent: function (intent, session, response) {
        console.log("ResumeIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/play';
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    },
    
    PlayAllIntent: function (intent, session, response) {
        console.log("PlayAllIntent received");
        options.path = '/play';
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    },

    PauseAllIntent: function (intent, session, response) {
        console.log("PauseAllIntent received");
        options.path = '/pauseall';
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    },

    PauseIntent: function (intent, session, response) {
        console.log("PauseIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/pause';
        httpreq(options, function(error) {
            genericResponse(error, response);
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

        actOnCoordinator(options, '/next', intent.slots.Room.value,  function (error, responseBodyJson) {
            genericResponse(error, response);
        });
    },

    PreviousTrackIntent: function (intent, session, response) {
        console.log("PreviousTrackIntent received");
        actOnCoordinator(options, '/previous', intent.slots.Room.value,  function (error, responseBodyJson) {
            genericResponse(error, response);
        });
    },

    WhatsPlayingIntent: function (intent, session, response) {
        console.log("WhatsPlayingIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/state';

        httpreq(options, function (error, responseJson) {
            if (!error) {
                responseJson = JSON.parse(responseJson);
                var randResponse = Math.floor(Math.random() * STATE_RESPONSES.length);
                var responseText = STATE_RESPONSES[randResponse].replace("$currentTitle", responseJson.currentTrack.title).replace("$currentArtist", responseJson.currentTrack.artist);
                response.tell(responseText);
            }
            else { 
                response.tell(error.message);
            }
        });
    },

    MuteIntent: function (intent, session, response) {
        console.log("MuteIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/mute';
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    },

    UnmuteIntent: function (intent, session, response) {
        console.log("UnmuteIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/unmute';
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    },

    ClearQueueIntent: function (intent, session, response) {
        console.log("ClearQueueIntent received");
        actOnCoordinator(options, '/clearqueue', intent.slots.Room.value,  function (error, responseBodyJson) {
            genericResponse(error, response);
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
    
    UngroupIntent: function (intent, session, response) {
        console.log("UngroupIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/isolate';
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    },
   
    JoinGroupIntent: function (intent, session, response) {
        console.log("JoinGroupIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.JoiningRoom.value) + '/join/' 
                + encodeURIComponent(intent.slots.PlayingRoom.value);
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    }
}

/** Handles playlists and favorites */
function playlistHandler(roomValue, presetValue, skillName, response) {
    var skillPath = '/' + skillName + '/' + encodeURIComponent(presetValue.toLowerCase());
    
    // This first action queues up the playlist / favorite, and it shouldn't say anything unless there's an error
    actOnCoordinator(options, skillPath, roomValue, function(error, responseBodyJson) {
        if (error) {
            genericResponse(error, response);
        }
    });
    
    // The 2nd action actually plays the playlist / favorite
    actOnCoordinator(options, '/play', roomValue, function(error, responseBodyJson) {
        genericResponse(error, response, "Queued and started " + presetValue);
    });
}

/** Handles all skills of the form /roomname/toggle/[on,off] */
function toggleHandler(roomValue, toggleValue, skillName, response) {
    if (!toggleValue || (toggleValue != 'on' && toggleValue != 'off')) {
        response.tell("I need to know if I should turn  " + skillName + " on or off. Example: Alexa, tell Sonos to turn " + skillName + " on");
        return;
    }

    options.path = '/' + encodeURIComponent(roomValue) + '/' + skillName + '/' + toggleValue;

    httpreq(options, function(error) {
        if (!error) {
            response.tell("Turned " + skillName + " " + toggleValue + " in " + roomValue);
        }
        else { 
          response.tell(error.message);
        }
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

        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    }

    else {
        actOnCoordinator(options, '/groupVolume/' + volume, roomAndGroup.room,  function (error, responseBodyJson) {
            genericResponse(error, response);
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
    
    if (groupIndex != -1) {
        roomAndGroupParsed.group = true;
        roomAndGroupParsed.room = roomArgument.replace("group","").trim();
    }
    else {
        roomAndGroupParsed.room = roomArgument;
    }
    
    return roomAndGroupParsed;
}

function httpreq(options, responseCallback) {
    var transport = options.useHttps ? https : http;
    
    console.log("Sending " + (options.useHttps ? "HTTPS" : "HTTP" ) + " request to: " + options.path);
  
    var req = transport.request(options, function(httpResponse) {
        var body = '';
        
        httpResponse.on('data', function(data) {
            body += data;
        });
        
        httpResponse.on('end', function() {
            responseCallback(undefined, body);
        });
    });

    req.on('error', function(e) {
        responseCallback(e);
    });

    req.end();
}

// 1) grab /zones and find the coordinator for the room being asked for
// 2) perform an action on that coordinator 
function actOnCoordinator(options, actionPath, room, onCompleteFun) {
    options.path = '/zones';
    console.log("getting zones...");

    var handleZonesResponse = function (error, responseJson) {
        if (!error) { 
            responseJson = JSON.parse(responseJson);
            var coordinatorRoomName = findCoordinatorForRoom(responseJson, room);
            options.path = '/' + encodeURIComponent(coordinatorRoomName) + actionPath;
            console.log(options.path);
            httpreq(options, onCompleteFun);
        }
        else { 
            onCompleteFun(error);
        }
    }

    httpreq(options, handleZonesResponse);
}

function genericResponse(error, response, success) {
    if (!error) {
        if (!success) {
            response.tell("OK");
        }
        else {
            response.tell(success);
        }
    }
    else {
        response.tell("The Lambda service encountered an error: " + error.message);
    }
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
