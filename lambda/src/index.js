'use strict';

var http = require('http');

var options = require('./options');

var AlexaSkill = require('./AlexaSkill');
var EchoSonos = function () {
    AlexaSkill.call(this, options.appid);
};

var SKIP_RESPONSES = [
    generateResponseTemplate("Skipping $currentArtist $currentTitle", true, false),
    generateResponseTemplate("Not a fan of $currentArtist?  Alright, we can skip them.", false, false),
    generateResponseTemplate("Don't like $currentTitle?  Skipping it.", false, false),
    generateResponseTemplate("No $currentArtist for you?  How about $nextArtist $nextTitle instead?", false, true)
];

var STATE_RESPONSES = [
    generateResponseTemplate("This is $currentArtist $currentTitle", true, false),
    generateResponseTemplate("We're listening to $currentTitle by $currentArtist", false, false),
    generateResponseTemplate("$currentTitle by $currentArtist", false, false)
];

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
    },
    NextTrackIntent: function (intent, session, response) {
        console.log("NextTrackIntent received");
        skipHttpreq(options, response);
    },
    PreviousTrackIntent: function (intent, session, response) {
        console.log("PreviousTrackIntent received");
        options.path = '/previous';
        httpreq(options, response, "OK");
    },
    WhatsPlayingIntent: function (intent, session, response) {
        console.log("WhatsPlayingIntent received");
        options.path = '/state';
        stateHttpreq(options, response);
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the EchoSonos skill.
    var echoSonos = new EchoSonos();
    echoSonos.execute(event, context);
};

function httpreq(options, alexaResponse, responseText) {
  //console.log("Trying http request with responseText " + responseText);
  http.request(options, function(httpResponse) {
    //console.log(httpResponse);
    if (responseText) {
        alexaResponse.tell(responseText);
    }
  }).end();
}

function stateHttpreq(options, alexaResponse) {
    http.request(options, function(httpResponse) {
        var body = '';
        httpResponse.on('data', function(data) {
            body += data;
        });
        httpResponse.on('end', function() {
            var currentState = JSON.parse(body);
            console.log("response: " + body)
            if (currentState.currentTrack) {
                alexaResponse.tell(generateRandomResponse(STATE_RESPONSES, currentState));
            }
        });
  }).end();
}

function skipHttpreq(options, alexaResponse) {
    options.path = "/state";
    http.request(options, function(httpResponse) {
        var body = '';
        httpResponse.on('data', function(data) {
            body += data;
        });
        httpResponse.on('end', function() {
            var currentState = JSON.parse(body);
            console.log("response1: " + body)
            options.path = "/next";
            http.request(options, function(httpResponse2) {
                console.log("response2: " + httpResponse2)
                if (currentState.currentTrack) {
                    alexaResponse.tell(generateRandomResponse(SKIP_RESPONSES, currentState));
                }
            }).end();
        });
  }).end();
}

function generateRandomResponse(responseTemplates, currentState) {
    var index = parseInt(Math.random() * responseTemplates.length, 10);
    return generateResponse(responseTemplates[index], currentState);
}

function generateResponse(responseTemplate, currentState) {
    var currentArtist = currentState.currentTrack.artist;
    if (responseTemplate.possessiveCurrentArtist) {
        currentArtist = makePossessive(currentArtist);
    }
    var nextArtist = currentState.nextTrack.artist;
    if (responseTemplate.possessiveNextArtist) {
        nextArtist = makePossessive(nextArtist);
    }
    var response = responseTemplate.template.
        replace("$currentArtist", currentArtist).
        replace("$currentTitle", currentState.currentTrack.title).
        replace("$nextArtist", nextArtist).
        replace("$nextTitle", currentState.nextTrack.title);
    console.log("Generated response: " + response);
    return response;
}

function makePossessive(name) {
    if (name.toLowerCase().charAt(name.length - 1) === 's') {
        return name + "'";
    }
    return name + "'s";
}

function generateResponseTemplate(template, possessiveCurrentArtist, possessiveNextArtist) {
    return {
        template: template,
        possessiveCurrentArtist: possessiveCurrentArtist,
        possessiveNextArtist: possessiveNextArtist
    }
}
