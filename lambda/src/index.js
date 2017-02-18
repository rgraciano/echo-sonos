/*jslint vars: true, plusplus: true, devel: true, indent: 4, maxerr: 50, node: true */ /*global define */
'use strict';

var sonosProxyFactory = require('./sonosProxy/sonosProxyFactory');
var sonosProxy = null;
var dynamodb = null;

var options = require('./options');
var defaultMusicService = ((options.defaultMusicService !== undefined) && (options.defaultMusicService > '')) ? options.defaultMusicService : 'presets';
var defaultRoom = (options.defaultRoom !== undefined) ? options.defaultRoom : '';


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

    AlbumIntent: function (intent, session, response) {
        console.log("AlbumIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            musicHandler(room, service, sonosProxy.ContentType.Album, intent.slots.AlbumName.value, response);
        });
    },

    ArtistIntent: function (intent, session, response) {
        console.log("ArtistIntent received for room " + intent.slots.Room.value);
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            musicHandler(room, service, sonosProxy.ContentType.Artist, intent.slots.ArtistName.value, response);
        });
    },

    TrackIntent: function (intent, session, response) {
        console.log("TrackIntent received for room " + intent.slots.Room.value);
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            musicHandler(room, service, sonosProxy.ContentType.Song, intent.slots.TrackName.value, response);
        });
    },

    MusicRadioIntent: function (intent, session, response) {
        console.log("MusicRadioIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            musicHandler(room, service, sonosProxy.ContentType.Station, intent.slots.ArtistName.value, response);
        });
    },

    PlayMoreByArtistIntent: function (intent, session, response) {
        console.log("PlayMoreByArtist received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            moreMusicHandler(room, service, '/song/', response);
        });
    },

    PlayMoreLikeTrackIntent: function (intent, session, response) {
        console.log("PlayMoreLikeTrackIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            moreMusicHandler(room, service, '/station/', response);
        });
    },

    SiriusXMStationIntent: function (intent, session, response) {
        console.log("SiriusXMStationIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            siriusXMHandler(room, intent.slots.Station.value, 'station', response);
        });
    },

    SiriusXMChannelIntent: function (intent, session, response) {
        console.log("SiriusXMChannelIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            siriusXMHandler(room, intent.slots.Channel.value, 'channel', response);
        });
    },

    PandoraMusicIntent: function (intent, session, response) {
        console.log("PandoraMusicIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            pandoraHandler(room, 'pandoraPlay', intent.slots.Name.value, response);
        });
    },

    PandoraThumbsUpIntent: function (intent, session, response) {
        console.log("PandoraThumbsUpIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            pandoraHandler(room, 'pandoraThumbsUp', '', response);
        });
    },

    PandoraThumbsDownIntent: function (intent, session, response) {
        console.log("PandoraThumbsDownIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            pandoraHandler(room, 'pandoraThumbsDown', '', response);
        });
    },

    PlayPresetIntent: function (intent, session, response) {
        console.log("PlayPresetIntent received");
        var promise = sonosProxy.preset(intent.slots.Preset.value.toLowerCase());
        handleResponse(promise, response);
    },

    PlaylistIntent: function (intent, session, response) {
        console.log("PlaylistIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            playlistHandler(room, intent.slots.Preset.value, 'playlist', response);
        });
    },

    FavoriteIntent: function (intent, session, response) {
        console.log("FavoriteIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            playlistHandler(room, intent.slots.Preset.value, 'favorite', response);
        });
    },

    ChangeRoomIntent: function (intent, session, response) {
        console.log("ChangeRoomIntent received");
        if (!options.advancedMode) {
           response.tell("This command does not work unless advanced mode is turned on");
        } else {
            changeCurrent('DefaultEcho', intent.slots.Room.value, '', function() {
                response.tell("OK");
            });
        }
    },

    ChangeServiceIntent: function (intent, session, response) {
        console.log("ChangeServiceIntent received");
        if (!options.advancedMode) {
            response.tell("This command does not work unless advanced mode is turned on");
        } else {
            changeCurrent('DefaultEcho', '', intent.slots.Service.value, function() {
                response.tell("OK");
            });
        }
    },

    ChangeRoomAndServiceIntent: function (intent, session, response) {
        console.log("ChangeRoomAndServiceIntent received");
        if (!options.advancedMode) {
            response.tell("This command does not work unless advanced mode is turned on");
        } else {
            changeCurrent('DefaultEcho', intent.slots.Room.value, intent.slots.Service.value, function() {
                response.tell("OK");
            });
        }
    },

    ResumeAllIntent: function (intent, session, response) {
        console.log("ResumeAllIntent received");
        var promise = sonosProxy.resumeAll();
        handleResponse(promise, response);
    },

    ResumeIntent: function (intent, session, response) {
        console.log("ResumeIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            var promise = sonosProxy.play(room);
            handleResponse(promise, response);
        });
    },

    PauseAllIntent: function (intent, session, response) {
        console.log("PauseAllIntent received");
        var promise = sonosProxy.pauseAll();
        handleResponse(promise, response);
    },

    PauseIntent: function (intent, session, response) {
        console.log("PauseIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            var promise = sonosProxy.pause(room);
            handleResponse(promise, response);
        });
    },

    VolumeDownIntent: function (intent, session, response) {
        console.log("VolumeDownIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            volumeHandler(room, response, '-10');
        });
    },

    VolumeUpIntent: function (intent, session, response) {
        console.log("VolumeUpIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            volumeHandler(room, response, '+10');
        });
    },

    SetVolumeIntent: function (intent, session, response) {
        console.log("SetVolumeIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            volumeHandler(room, response, intent.slots.Percent.value);
        });
    },

    NextTrackIntent: function (intent, session, response) {
        console.log("NextTrackIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            var promise = getCoordinatorForRoom(room).then((coordinator) => {
                return sonosProxy.next(coordinator);
            });
            
            handleResponse(promise, response);
        });
    },

    PreviousTrackIntent: function (intent, session, response) {
        console.log("PreviousTrackIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            var promise = getCoordinatorForRoom(room).then((coordinator) => {
                return sonosProxy.previous(coordinator);
            });
            
            handleResponse(promise, response);
        });
    },

    WhatsPlayingIntent: function (intent, session, response) {
        console.log("WhatsPlayingIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            sonosProxy.getState(room).then((data) => {
                 var responseJson = JSON.parse(data);
                 var randResponse = Math.floor(Math.random() * STATE_RESPONSES.length);
                 var responseText = STATE_RESPONSES[randResponse].replace("$currentTitle", responseJson.currentTrack.title).replace("$currentArtist", responseJson.currentTrack.artist);
                 response.tell(responseText);
            }).catch((error) => {
                response.tell(error.message);
            });
        });
    },

    MuteIntent: function (intent, session, response) {
        console.log("MuteIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            var promise = sonosProxy.mute(room);
            handleResponse(promise, response);
        });
    },

    UnmuteIntent: function (intent, session, response) {
        console.log("UnmuteIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            var promise = sonosProxy.unmute(room);
            handleResponse(promise, response);
        });
    },

    ClearQueueIntent: function (intent, session, response) {
        console.log("ClearQueueIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            var promise = getCoordinatorForRoom(room).then((coordinator) => {
                return sonosProxy.clearqueue(coordinator);
            });
            
            handleResponse(promise, response);
        });
    },

    RepeatIntent: function (intent, session, response) {
        console.log("RepeatIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            toggleHandler(room, intent.slots.Toggle.value, "repeat", response);
        });
    },

    ShuffleIntent: function (intent, session, response) {
        console.log("ShuffleIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            toggleHandler(room, intent.slots.Toggle.value, "shuffle", response);
        });
    },

    CrossfadeIntent: function (intent, session, response) {
        console.log("CrossfadeIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            toggleHandler(room, intent.slots.Toggle.value, "crossfade", response);
        });
    },

    UngroupIntent: function (intent, session, response) {
        console.log("UngroupIntent received");
        loadCurrentRoomAndService('DefaultEcho', intent.slots.Room.value, function(room, service) {
            var promise = sonosProxy.isolate(room);
            handleResponse(promise, response);
        });
    },

    JoinGroupIntent: function (intent, session, response) {
        console.log("JoinGroupIntent received");
        var promise = sonosProxy.join(intent.slots.JoiningRoom.value, intent.slots.PlayingRoom.value);
        handleResponse(promise, response);
    },

    PlayInRoomIntent: function (intent, session, response) {
        console.log("PlayInRoomIntent received");

        if (options.defaultLinein === '' || !options.defaultLinein) {
            response.tell("This command does not work unless you set default Linein");
        }

        var promise = sonosProxy.lineIn(intent.slots.Room.value, options.defaultLinein);
        handleResponse(promise, response);
    },

    LineInIntent: function (intent, session, response) {
        console.log("LineInIntent received");

        var room = intent.slots.Room.value;
        var lineIn = intent.slots.LineIn.value || room;

        var promise = sonosProxy.lineIn(room, lineIn);
        handleResponse(promise, response);
    }
};

/** Handles Apple Music, Spotify, Deezer, library, or presets. The default can be specified in options.js or changed if advanced mode is turned on */
function musicHandler(room, service, type, content, response) {

    if (service == 'presets') {
        var promise = sonosProxy.preset(content);
        handleResponse(promise, response);
        return;
    } 

    var promise = getCoordinatorForRoom(room)
    .then((coordinator) => {
        return sonosProxy.playContent(room, service, type, content);
    });
        
    handleResponse(promise, response, `Started playing ${type} ${content}`);
}

/** Handles Apple Music - plays artist tracks or plays a radio station for the current track */
function moreMusicHandler(room, service, type, response) {
    var promise = sonosProxy.getState(room).then((data) => {
        var responseJson = JSON.parse(data);
        console.log("Currently Playing : " + JSON.stringify(responseJson, null, 2));

        if (responseJson.currentTrack.artist !== undefined) {
            var content = responseJson.currentTrack.artist;
            if (type === sonosProxy.ContentType.Station && (['apple','spotify','deezer','elite'].indexOf(service) != -1)) {
                content += ' ' + responseJson.currentTrack.title;
            }

            musicHandler(room, service, type, content, response);
        } else {
            response.tell("The current artist is not identified");
        }
    });

    handleResponse(promise, response);
}

/** Handles SiriusXM Radio */
function siriusXMHandler(room, content, type, response) {
    var promise = getCoordinatorForRoom(room)
    .then((coordinator) => {
       return sonosProxy.siriusXmPlay(coordinator, content);
    });

    var successResponse = `Sirius XM ${type} ${content} started`;
    handleResponse(promise, response, successResponse);
}

/** Handles Pandora */
function pandoraHandler(room, action, content, response) {
    var isPlay = action == 'pandoraPlay';
   
    var promise = getCoordinatorForRoom(room)
    .then((coordinator) => {
        if(isPlay) {
            return sonosProxy.pandoraPlay(coordinator, content);
        }

        return sonosProxy[action](coordinator);
    });

     var successResponse = isPlay ? `Pandora ${content} started` : undefined;
     handleResponse(promise, response, successResponse);
}

/** Handles playlists and favorites */
function playlistHandler(room, presetValue, skillName, response) {
    var coordinator = null;

    var promise = getCoordinatorForRoom(room)
    // This first action queues up the playlist / favorite, and it shouldn't say anything unless there's an error
    .then((data) => {
        coordinator = data;
        return sonosProxy[skillName](coordinator, presetValue.toLowerCase());
    })
    // The 2nd action actually plays the playlist / favorite
    .then(() => {
        return sonosProxy.play(coordinator);
    });

    var successResponse = `Queued and started ${presetValue}`;
    handleResponse(promise, response, successResponse);
}

/** Handles all skills of the form /roomname/toggle/[on,off] */
function toggleHandler(roomValue, toggleValue, skillName, response) {
    if (!toggleValue || (toggleValue != sonosProxy.State.On && toggleValue != sonosProxy.State.Off)) {
        response.tell("I need to know if I should turn  " + skillName + " on or off. Example: Alexa, tell Sonos to turn " + skillName + " on");
        return;
    }

    var promise = sonosProxy[skillName](roomValue, toggleValue);
    var successMessage = `${skillName} is now ${toggleValue} in ${roomValue}`
    handleResponse(promise, response, successMessage);
}

/** Handles up, down, & absolute volume for either an individual room or an entire group */
function volumeHandler(roomValue, response, volume) {
    var roomAndGroup = parseRoomAndGroup(roomValue);

    if (!roomAndGroup.room) {
        response.tell("Please specify a room. For example, turn the volume down in the KITCHEN");
        return;
    }

    if (!roomAndGroup.group) {
        let promise = sonosProxy.setVolume(roomAndGroup.room, volume);
        handleResponse(promise, response);
    }

    else {
        let promise = getCoordinatorForRoom(roomAndGroup.room).then((coordinator) => {
            return sonosProxy.setGroupVolume(coordinator, volume);
        });
            
        handleResponse(promise, response);
    }
}

/* Given a string roomArgument that either looks like "my room" or "my room group",
 * returns an object with two members:
 *   obj.group: true if roomArgument ends with "group", false otherwise.
 *   obj.room: if roomArgument is "my room group", returns "my room"
 */
function parseRoomAndGroup(roomArgument) {
    var roomAndGroupParsed = {};
    roomAndGroupParsed.group = false;
    roomAndGroupParsed.room = false;

    if (!roomArgument) {
        return roomAndGroupParsed;
    }

    var groupIndex = roomArgument.indexOf("group");

    if (groupIndex && (groupIndex + 4 == (roomArgument.length - 1)) && roomArgument.length >= 7) {
        roomAndGroupParsed.group = true;
        roomAndGroupParsed.room = roomArgument.substr(0, groupIndex - 1);
    } else {
        roomAndGroupParsed.room = roomArgument;
    }

    return roomAndGroupParsed;
}

function isBlank(val) {
    return ((val === undefined) || (val === null) || (val === ''));
}

function changeCurrent(echoId, room, service, onCompleteFn) {
    var updateExpression = '';
    var values = {};

    if (options.advancedMode) {
        if (!isBlank(room) && !isBlank(service)) {
            updateExpression = "set currentRoom=:r, currentMusicService=:s";
            values = {":r":room, ":s":service};
        } else if (!isBlank(room)) {
            updateExpression = "set currentRoom=:r";
            values = {":r":room};
        } else if (!isBlank(service)) {
            updateExpression = "set currentMusicService=:s";
            values = {":s":service};
        }
        if (updateExpression !== '') {
            var docClient = new AWS.DynamoDB.DocumentClient();
            var params = {
                TableName: "echo-sonos",
                Key: {
                    "echoid": echoId
                },
                UpdateExpression: updateExpression,
                ExpressionAttributeValues:values,
                ReturnValues:"UPDATED_NEW"
            };

            console.log("Updating current defaults...");
            docClient.update(params, function(err, data) {
                if (err) {
                    console.error("Unable to update current defaults. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Update of current defaults succeeded:", JSON.stringify(data, null, 2));
                }
                onCompleteFn();
            });
        }
    } else {
        console.error("Unable to change defaults when not in Advanced Mode");
    }
}

function loadCurrentRoomAndService(echoId, room, onCompleteFn) {
    var service = '';

    function checkDefaults() {
        if (isBlank(room)) {
            room = defaultRoom;
        }
        if (isBlank(service)) {
            service = defaultMusicService;
        }
    }


    console.log("Advanced Mode = " + options.advancedMode);
    if (options.advancedMode) {
        function addCurrent(onCompleteFn) {
            checkDefaults();

            var docClient = new AWS.DynamoDB.DocumentClient();
            var params = {
                TableName: "echo-sonos",
                Item:{
                    "echoid": echoId,
                    "currentRoom": room,
                    "currentMusicService": service
                }
            };

            console.log("Adding current settings record");
            docClient.put(params, function(err, data) {
                console.log("err=" + JSON.stringify(err, null, 2));
                console.log("data=" + JSON.stringify(data, null, 2));
                if (err) {
                    console.error("Unable to add default. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    onCompleteFn(room, service);
                    }
            });
        }

        function readCurrent(onCompleteFn) {
            var newRoom = '';
            var newService = '';
            var docClient = new AWS.DynamoDB.DocumentClient();
            var params = {
                TableName: "echo-sonos",
                Key: {
                    "echoid": echoId
                }
            };

            console.log("Reading current settings");
            docClient.get(params, function(err, data) {
                //console.log("err=" + JSON.stringify(err, null, 2));
                //console.log("data=" + JSON.stringify(data, null, 2));
                if (err || (data.Item === undefined)) {
                    addCurrent(onCompleteFn);
                } else {
                    if (isBlank(room)) {
                        room = data.Item.currentRoom;
                    } else if (room != data.Item.currentRoom) {
                      newRoom = room;
                    }
                    if (isBlank(service)) {
                        service = data.Item.currentMusicService;
                    } else if (service != data.Item.currentMusicService) {
                        newService = service;
                    }
                    console.log("room=" + room +" newRoom=" + newRoom + "  service=" + service + " newService=" + newService);
                    if (isBlank(newRoom) && isBlank(newService)) {
                        onCompleteFn(room, service);
                    } else {
                        changeCurrent(echoId, newRoom, newService, function() {
                            onCompleteFn(room, service);
                        });
                    }
                }
            });
        }

        AWS.config.update({
            region: process.env.AWS_REGION,
            endpoint: "https://dynamodb." + process.env.AWS_REGION + ".amazonaws.com"
        });
        var dynamodb = new AWS.DynamoDB();

        dynamodb.listTables(function(err, data) {
            if (err) {
                console.log(err, err.stack);
            } else if ((data.TableNames.length === 0) || (data.TableNames.indexOf("echo-sonos") == -1))  {
                var params = {
                    TableName : "echo-sonos",
                    KeySchema: [
                        { AttributeName: "echoid", KeyType: "HASH"}  //Partition key
                    ],
                    AttributeDefinitions: [
                        { AttributeName: "echoid", AttributeType: "S" }
                    ],
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 1,
                        WriteCapacityUnits: 1
                    }
                };

                console.log("Create echo-sonos table");
                dynamodb.createTable(params, function(err, data) {
                    if (err) {
                        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        params = {
                            TableName : "echo-sonos"
                        };

                        dynamodb.waitFor('tableExists', params, function(err, data) {
                              if (err) {
                                console.error("Unable to wait for table table. Error JSON:", JSON.stringify(err, null, 2));
                              } else {
                                  addCurrent(onCompleteFn);
                              }
                        });
                    }
                });
            } else if (isBlank(service) || isBlank(room)) {
                readCurrent(onCompleteFn);
            }
        });
    } else {
        checkDefaults();
        onCompleteFn(room, service);
    }
}

//Gets the coordinator for a given room
//returns a promise
//TODO move (to a state service?) and cache zones results, save zone and a room list
function getCoordinatorForRoom(room) {
    console.log(`Getting coordinator for room: ${room}`);

    var promise = sonosProxy.getZones().then((data) => {
        var responseJson = JSON.parse(data);
        var coordinator = findCoordinatorForRoom(responseJson, room);

        console.log(`Coordinator for ${room} : ${coordinator}`);
        return coordinator;
    })

    return promise;
}

// Given a room name, returns the name of the coordinator for that room
function findCoordinatorForRoom(responseJson, room) {
    for (var i = 0; i < responseJson.length; i++) {
        var zone = responseJson[i];

        for (var j = 0; j < zone.members.length; j++) {
            var member = zone.members[j];

            if ((member.roomName !== undefined) && (member.roomName.toLowerCase() == room.toLowerCase())) {
                return zone.coordinator.roomName;
            }
        }
    }
}

function handleResponse(promise, response, success) {
    promise.then(() => response.tell(success || "OK"))
           .catch((error) => response.tell("The Lambda service encountered an error: " + error.message));
}

function getUrl(options) {
    var protocol = options.useHttps ? 'https' : 'http';
    return `${protocol}://${options.host}:${options.port}`;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the EchoSonos skill.
    var echoSonos = new EchoSonos();
    if (options.useSQS) {
        var region = process.env.AWS_REGION;
        var arn = context.invokedFunctionArn;
        var actLoc = arn.indexOf(region) + region.length + 1;
        var accountId = arn.substring(actLoc,arn.indexOf(':',actLoc));
        var baseSqsUrl = "https://sqs." + region + ".amazonaws.com/" + accountId;

        sonosProxy = sonosProxyFactory.get(baseSqsUrl, options.useSQS);
    }
    else {
        sonosProxy = sonosProxyFactory.get(getUrl(options), options.useSQS);
    }
    

    echoSonos.execute(event, context);
};
