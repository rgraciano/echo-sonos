'use strict';

var http = require('http');

var options = require('./options');

var AlexaSkill = require('./AlexaSkill');
var EchoSonos = function () {
    AlexaSkill.call(this, options.appid);
};

EchoSonos.prototype = Object.create(AlexaSkill.prototype);
EchoSonos.prototype.constructor = EchoSonos;

EchoSonos.prototype.intentHandlers = {
    // register custom intent handlers
    PartyIntent: function (intent, session, response) {
        console.log("PartyIntent received");
        options.path = '/preset/party';
        httpreq(options, response, "Party Time!";
    },
    LoungeIntent: function (intent, session, response) {
        console.log("LoungeIntent received");
        options.path = '/preset/lounge';
        httpreq(options, response, "Smoooooth";
    },
    ChillIntent: function (intent, session, response) {
        console.log("ChillIntent received");
        options.path = '/preset/chill';
        httpreq(options, response, "OK";
    },
    PlayIntent: function (intent, session, response) {
        console.log("PlayIntent received");
        options.path = '/preset/'+encodeURIComponent(intent.slots.Preset.value);
        httpreq(options, response, "Playing " + intent.slots.Preset.value);
    },
    PauseIntent: function (intent, session, response) {
        console.log("PauseIntent received");
        options.path = '/pauseall';
        httpreq(options, response, "Pausing");
    },
    NextIntent: function (intent, session, response) {
        console.log("NextIntent received");
        options.path = '/next';
        httpreq(options, response, "OK");
    },
    PrevIntent: function (intent, session, response) {
        console.log("PreviousIntent received");
        options.path = '/previous';
        httpreq(options, response, "OK");
    },
    StateIntent: function (intent, session, response) {
        console.log("StateIntent received");
        options.path = '/state';
        http.get(options, function(res) {
            var body = '';
            res.setEncoding("utf8");
            res.on('data', function (chunk) {
                body += chunk;
            });

            res.on('end', function () {
              var obj = JSON.parse(body);

              httpreq(options, response, "Currently Playing: " + obj.currentTrack.title + ", by " + obj.currentTrack.artist) + ".";
            });
        }).on('error', function (e) {
            console.log("Got error: ", e);
        });
    },
    VolumeIntent: function (intent, session, response) {
      var speechResponse = "";
      if (intent.slots.Room && intent.slots.Room.value) {
        console.log("VolumeIntent received for " + intent.slots.Room.value);
        options.path = '/'+encodeURIComponent(intent.slots.Room.value) + '/volume/'+encodeURIComponent(intent.slots.Level.value);
        speechResponse = "Changing "+ intent.slots.Room.value + " volume";
      } else {
        console.log("VolumeIntent " + intent.slots.Level.value + " received");
        options.path = '/groupVolume/'+encodeURIComponent(intent.slots.Level.value);
        speechResponse = "OK";
      }
      httpreq(options, response, speechResponse);
    },
    VolumeDownIntent: function (intent, session, response) {
      var speechResponse = "";
      if (intent.slots.Room && intent.slots.Room.value) {
        console.log("VolumeDownIntent received for" + intents.slots.Room.value);
        options.path = '/'+encodeURIComponent(intent.slots.Room.value) + '/volume/-10';
        speechResponse = "Turning down the " + intent.slots.Room.value + ".";
      } else {
        console.log("VolumeDownIntent received.");
        options.path = '/groupVolume/-10';
        speechResponse = "Whatever";
      }
      httpreq(options, response, speechResponse);
    },
    VolumeUpIntent: function (intent, session, response) {
      var speechResponse = "";
      if (intent.slots.Room && intent.slots.Room.value) {
        console.log("VolumeDownIntent received for" + intents.slots.Room.value);
        options.path = '/'+encodeURIComponent(intent.slots.Room.value) + '/volume/+10';
        speechResponse = "Turning down the " + intent.slots.Room.value + ".";
      } else {
        console.log("VolumeDownIntent received.");
        options.path = '/groupVolume/+10';
        speechResponse = "OK";
      }
      httpreq(options, response, speechResponse);
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the EchoSonos skill.
    var echoSonos = new EchoSonos();
    echoSonos.execute(event, context);
};

function httpreq(options, alexaResponse, responseText) {
  console.log("Trying http request with responseText " + responseText);
  http.request(options, function(httpResponse) {
    console.log(httpResponse.body);
    if (responseText)
        alexaResponse.tell(responseText);
  }).end();
}
