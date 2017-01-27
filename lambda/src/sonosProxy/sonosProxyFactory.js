'use strict';

var httpClient = require('./httpClient');
var sqsClient = require('./sqsClient');
var sonosProxyFactory =  {};
var sonosProxy = {};


/**
 * Use factory patern to get a sonosProxy with a given baseUrl
 * sonosProxy provides an interface for node-sonos-http-api
 */
sonosProxyFactory.get = function(baseUrl, useSqs){
    sonosProxy.baseUrl = baseUrl;
    sonosProxy.useSqs = useSqs || false;

    return sonosProxy
};


/**
 * Enum
 */
sonosProxy.Service = {'Apple':'apple', 'Spotify': 'spotify', 'Deezer':'deezer', 'Elite':'elite', 'Library':'library'};
sonosProxy.SearchType = {'Album':'album', 'Song':'song', 'Station':'station'};

/**
 * Info
 */
sonosProxy.getZones = function() {
    var path = `/zones`;
    return makeCall(path);
};

sonosProxy.getFavorites = function() {
    var path = `/favorites`;
    return makeCall(path);
};

sonosProxy.getPlaylists = function() {
    var path = `/playlists`;
    return makeCall(path);
};

/**
 * Global Commands
 */
sonosProxy.pauseAll = function(timeoutInMinutes) {
    var path = timeoutInMinutes === undefined ?  
        `/pauseall` : `/pauseall/${encodeURIComponent(timeoutInMinutes)}`;

    return makeCall(path);
};

sonosProxy.resumeAll = function(timeoutInMinutes) {
    var path = timeoutInMinutes === undefined ?  
        `/resumeall` : `/resumeall/${encodeURIComponent(timeoutInMinutes)}`;

    return makeCall(path);
};

sonosProxy.preset = function(preset) {
    var preset = encodeURIComponent(preset);
    var path = `/preset/${preset}`;

    return makeCall(path);
};

sonosProxy.sleep = function(timeout) {
    var timeout = encodeURIComponent(timeout);
    var path = `/sleep/${timeout}`;

    return makeCall(path);
};


/**
 * Zone Control
 */
sonosProxy.play = function(room) {
    var room = encodeURIComponent(room);
    var path = `/${room}/play`;

    return makeCall(path);
};

sonosProxy.pause = function(room) {
    var room = encodeURIComponent(room);
    var path = `/${room}/pause`;

    return makeCall(path);
};

sonosProxy.togglePlay = function(room) {
    var room = encodeURIComponent(room);
    var path = `/${room}/playpause`;

    return makeCall(path);
};

sonosProxy.setVolume = function(room, volume) {
    var room = encodeURIComponent(room);
    var volume = encodeURIComponent(volume);
    var path = `/${room}/volume/${volume}`;

    return makeCall(path);
};

sonosProxy.increaseVolume = function(room, volumeIncrease) {
    var room = encodeURIComponent(room);
    var volumeIncrease = encodeURIComponent(volumeIncrease);
    var path = `/${room}/volume/+${volumeIncrease}`;

    return makeCall(path);
};

sonosProxy.decreaseVolume = function(room, volumeDecrease) {
    var room = encodeURIComponent(room);
    var volumeIncrease = encodeURIComponent(volumeDecrease);
    var path = `/${room}/volume/-${volumeDecrease}`;

    return makeCall(path);
};

sonosProxy.setGroupVolume = function(room, volume) {
    var room = encodeURIComponent(room);
    var volume = encodeURIComponent(volume);
    var path = `/${room}/groupVolume/${volume}`;

    return makeCall(path);
};

sonosProxy.increaseGroupVolume = function(room, volumeIncrease) {
    var room = encodeURIComponent(room);
    var volumeIncrease = encodeURIComponent(volumeIncrease);
    var path = `/${room}/groupVolume/+${volumeIncrease}`;

    return makeCall(path);
};

sonosProxy.decreaseGroupVolume = function(room, volumeDecrease) {
    var room = encodeURIComponent(room);
    var volumeIncrease = encodeURIComponent(volumeDecrease);
    var path = `/${room}/groupVolume/-${volumeDecrease}`;

    return makeCall(path);
};

sonosProxy.mute = function(room) {
    var room = encodeURIComponent(room);
    var path = `/${room}/mute`;

    return makeCall(path);
};

sonosProxy.unmute = function(room) {
    var room = encodeURIComponent(room);
    var path = `/${room}/unmute`;

    return makeCall(path);
};

sonosProxy.toggleMute = function(room) {
    var room = encodeURIComponent(room);
    var path = `/${room}/togglemute`;

    return makeCall(path);
};

sonosProxy.next = function(room) {
    var room = encodeURIComponent(room);
    var path = `/${room}/next`;

    return makeCall(path);
};

sonosProxy.previous = function(room) {
    var room = encodeURIComponent(room);
    var path = `/${room}/previous`;

    return makeCall(path);
};

sonosProxy.playlist = function(room, playlist) {
    var room = encodeURIComponent(room);
    var playlist = encodeURIComponent(playlist);
    var path = `/${room}/playlist/${playlist}`;

    return makeCall(path);
};

sonosProxy.say = function(room, phrase, volume, languageCode) {
    var room = encodeURIComponent(room);
    var phrase = encodeURIComponent(phrase);
    var volume = volume ? encodeURIComponent(volume) : '30';
    var languageCode = languageCode ? encodeURIComponent(languageCode) : 'en-us';

    var path = `/${room}/say/${phrase}/${languageCode}/${volume}`;

    return makeCall(path);
};

sonosProxy.lineIn = function(room, lineIn) {
    var room = encodeURIComponent(room);
    var lineIn = encodeURIComponent(lineIn);
    var path = `/${room}/linein/${lineIn}`;

    return makeCall(path);
};

sonosProxy.playContent = function(room, service, type, content) {
    var room = encodeURIComponent(room);
    var service = encodeURIComponent(service);
    var type = encodeURIComponent(type);
    var content = encodeURIComponent(content);

    var path = `/${room}/musicsearch/${service}/${type}/${content}`;

    return makeCall(path);
};

sonosProxy.playSong = function(room, service, song) {
    return playContent(room, service, this.SearchType.Song, song);
};

sonosProxy.playArtist = function(room, service, artist) {
    return playContent(room, service, this.SearchType.Song, artist);
};

sonosProxy.playAlbum = function(room, service, album) {
    return playContent(room, service, this.SearchType.Album, album);
};

sonosProxy.playStation = function(room, service, station) {
    return playContent(room, service, this.SearchType.Station, station);
};

function makeCall(path) {  
    if(sonosProxy.useSqs){
        return sqsClient.get(path).then((data) => logSqsSuccess(path, data), 
                                        (error) => logSqsFailure(path, error));
    }
    
    var url = sonosProxy.baseUrl + path;
    return httpClient.get(url).then((data) => logCallSuccess(url, data), 
                                    (error) => logCallFailure(url, error));
}

function logCallSuccess(url, data) {
    console.log(`Call to '${url}' suceeded`)
                                                  
    return data;
}

function logCallFailure(url, error) {
    console.log(`Call to '${url}' failed`);
    console.log(error);

    return error;
}

function logSqsSuccess(path, data) {
    console.log(`Sqs '${path}' suceeded`);
                                                  
    return data;
}

function logSqsFailure(path, error) {
    console.log(`Sqs '${path}' failed`);
    console.log(error);

    return error;
}

module.exports = sonosProxyFactory;