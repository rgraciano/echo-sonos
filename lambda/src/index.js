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
        options.path = '/preset/'+encodeURIComponent(intent.slots.Preset.value);
        httpreq(options, function() {});
    },

    PlaylistIntent: function (intent, session, response) {
        console.log("PlaylistIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/playlist/' + encodeURIComponent(intent.slots.Preset.value);
        httpreq(options, function() {});
    },

    FavoriteIntent: function (intent, session, response) {
        console.log("FavoriteIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/favorite/' + encodeURIComponent(intent.slots.Preset.value);
        httpreq(options, function() {});
    },

    ResumeIntent: function (intent, session, response) {
        console.log("ResumeIntent received");
        options.path = '/resumeall';
        httpreq(options, function() {});
    },

    PauseIntent: function (intent, session, response) {
        console.log("PauseIntent received");
        options.path = '/pauseall';
        httpreq(options, function() {});
    },

    VolumeDownIntent: function (intent, session, response) {
        console.log("VolumeDownIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/volume/-10';
        httpreq(options, function() {});
    },

    VolumeUpIntent: function (intent, session, response) {
        console.log("VolumeUpIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/volume/+10';
        httpreq(options, function() {});
    },

    SetVolumeIntent: function (intent, session, response) {
        console.log("SetVolumeIntent received");
        options.path = '/'  + encodeURIComponent(intent.slots.Room.value) + '/volume/' + encodeURIComponent(intent.slots.Percent.value);
        httpreq(options, function() {});
    },

    NextTrackIntent: function (intent, session, response) {
        console.log("NextTrackIntent received");

        actOnCoordinator(options, '/next', intent.slots.Room.value,  function (responseBodyJson) {
            // do nothing on response; hearing the track change is ample confirmation
        });
    },

    PreviousTrackIntent: function (intent, session, response) {
        console.log("PreviousTrackIntent received");
        actOnCoordinator(options, '/previous', intent.slots.Room.value,  function (responseBodyJson) {
            // do nothing on response; hearing the track change is ample confirmation
        });
    },

    WhatsPlayingIntent: function (intent, session, response) {
        console.log("WhatsPlayingIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/state';

        httpreq(options, function (responseJson) {
            var randResponse = Math.floor(Math.random() * STATE_RESPONSES.length);
            
            var responseText = STATE_RESPONSES[randResponse].replace("$currentTitle", responseJson.currentTrack.title).replace("$currentArtist", responseJson.currentTrack.artist);

            response.tell(responseText);
        });
    },

    MuteIntent: function (intent, session, response) {
        console.log("MuteIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/mute';
        httpreq(options, function() {});
    },

    UnmuteIntent: function (intent, session, response) {
        console.log("UnmuteIntent received");
        options.path = '/' + encodeURIComponent(intent.slots.Room.value) + '/unmute';
        httpreq(options, function() {});
    },
}

// HTTP call intended for node-sonos-http-api. Parses response & returns as JSON object
function httpreq(options, responseCallback) {
  http.request(options, function(httpResponse) {
      var body = '';
      
      httpResponse.on('data', function(data) {
          body += data;
      });
      
      httpResponse.on('end', function() {
          responseCallback(JSON.parse(body));
      });
  }).end();
}

// 1) grab /zones and find the coordinator for the room being asked for
// 2) perform an action on that coordinator 
function actOnCoordinator(options, actionPath, room, onCompleteFun) {
    options.path = '/zones';

    var handleZonesResponse = function (responseJson) {
        var coordinatorRoomName = findCoordinatorForRoom(responseJson, room);
        options.path = '/' + encodeURIComponent(coordinatorRoomName) + actionPath;
        httpreq(options, onCompleteFun);
    }

    httpreq(options, handleZonesResponse);
}

// Given a room name, returns the name of the coordinator for that room
function findCoordinatorForRoom(responseJson, room) {
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
