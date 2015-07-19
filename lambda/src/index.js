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
    VolumeDownIntent: function (intent, session, response) {
        console.log("VolumeDownIntent received");
        options.path = '/groupVolume/-10';
        httpreq(options, response, "OK");
    },
    VolumeUpIntent: function (intent, session, response) {
        console.log("VolumeUpIntent received");
        options.path = '/groupVolume/+10';
        httpreq(options, response, "OK");
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
