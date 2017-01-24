'use strict';

var httpClient = require('./httpClient');
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
    var url = `${this.baseUrl}/zones`;
    return makeCall(url, this.useSqs);
};

sonosProxy.getFavorites = function() {
    var url = `${this.baseUrl}/favorites`;
    return makeCall(url, this.useSqs);
};

sonosProxy.getPlaylists = function() {
    var url = `${this.baseUrl}/playlists`;
    return makeCall(url, this.useSqs);
};

/**
 * Global Commands
 */
sonosProxy.pauseAll = function(timeoutInMinutes) {
    var url = timeoutInMinutes === undefined ?  
        `${this.baseUrl}/pauseall` : `${this.baseUrl}/pauseall/${encodeURIComponent(timeoutInMinutes)}`;

    return makeCall(url, this.useSqs);
};

sonosProxy.resumeAll = function(timeoutInMinutes) {
    var url = timeoutInMinutes === undefined ?  
        `${this.baseUrl}/resumeall` : `${this.baseUrl}/resumeall/${encodeURIComponent(timeoutInMinutes)}`;

    return makeCall(url, this.useSqs);
};

sonosProxy.preset = function(preset) {
    var preset = encodeURIComponent(preset);
    var url = `${this.baseUrl}/preset/${preset}`;

    return makeCall(url, this.useSqs);
};

sonosProxy.sleep = function(timeout) {
    var timeout = encodeURIComponent(timeout);
    var url = `${this.baseUrl}/sleep/${timeout}`;

    return makeCall(url, this.useSqs);
};


/**
 * Zone Control
 */
sonosProxy.play = function(room) {
    var room = encodeURIComponent(room);
    var url = `${this.baseUrl}/${room}/play`;

    return makeCall(url, this.useSqs);
};

sonosProxy.pause = function(room) {
    var room = encodeURIComponent(room);
    var url = `${this.baseUrl}/${room}/pause`;

    return makeCall(url, this.useSqs);
};

sonosProxy.togglePlay = function(room) {
    var room = encodeURIComponent(room);
    var url = `${this.baseUrl}/${room}/playpause`;

    return makeCall(url, this.useSqs);
};

sonosProxy.setVolume = function(room, volume) {
    var room = encodeURIComponent(room);
    var volume = encodeURIComponent(volume);
    var url = `${this.baseUrl}/${room}/volume/${volume}`;

    return makeCall(url, this.useSqs);
};

sonosProxy.increaseVolume = function(room, volumeIncrease) {
    var room = encodeURIComponent(room);
    var volumeIncrease = encodeURIComponent(volumeIncrease);
    var url = `${this.baseUrl}/${room}/volume/+${volumeIncrease}`;

    return makeCall(url, this.useSqs);
};

sonosProxy.decreaseVolume = function(room, volumeDecrease) {
    var room = encodeURIComponent(room);
    var volumeIncrease = encodeURIComponent(volumeDecrease);
    var url = `${this.baseUrl}/${room}/volume/-${volumeDecrease}`;

    return makeCall(url, this.useSqs);
};

sonosProxy.setGroupVolume = function(room, volume) {
    var room = encodeURIComponent(room);
    var volume = encodeURIComponent(volume);
    var url = `${this.baseUrl}/${room}/groupVolume/${volume}`;

    return makeCall(url, this.useSqs);
};

sonosProxy.increaseGroupVolume = function(room, volumeIncrease) {
    var room = encodeURIComponent(room);
    var volumeIncrease = encodeURIComponent(volumeIncrease);
    var url = `${this.baseUrl}/${room}/groupVolume/+${volumeIncrease}`;

    return makeCall(url, this.useSqs);
};

sonosProxy.decreaseGroupVolume = function(room, volumeDecrease) {
    var room = encodeURIComponent(room);
    var volumeIncrease = encodeURIComponent(volumeDecrease);
    var url = `${this.baseUrl}/${room}/groupVolume/-${volumeDecrease}`;

    return makeCall(url, this.useSqs);
};

sonosProxy.mute = function(room) {
    var room = encodeURIComponent(room);
    var url = `${this.baseUrl}/${room}/mute`;

    return makeCall(url, this.useSqs);
};

sonosProxy.unmute = function(room) {
    var room = encodeURIComponent(room);
    var url = `${this.baseUrl}/${room}/unmute`;

    return makeCall(url, this.useSqs);
};

sonosProxy.toggleMute = function(room) {
    var room = encodeURIComponent(room);
    var url = `${this.baseUrl}/${room}/togglemute`;

    return makeCall(url, this.useSqs);
};

sonosProxy.lineIn = function(room, lineIn) {
    var room = encodeURIComponent(room);
    var lineIn = encodeURIComponent(lineIn);
    var url = `${this.baseUrl}/${room}/linein/${lineIn}`;

    return makeCall(url, this.useSqs);
};

sonosProxy.playContent = function(room, service, type, content) {
    var room = encodeURIComponent(room);
    var service = encodeURIComponent(service);
    var type = encodeURIComponent(type);
    var content = encodeURIComponent(content);

    var url = `${this.baseUrl}/${room}/musicsearch/${service}/${type}/${content}`;

    return makeCall(url, this.useSqs);
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

function makeCall(url, useSqs) {  
    if(useSqs){
        //TODO add sqs logic here
        return new Promise((resolve, reject) => reject('Not Implemented'));
    }

    return httpClient.get(url).then(() => console.log(`Call to '${url}' suceeded`), 
                                    (data) => console.log(`Call to '${url}' failed`));
}

module.exports = sonosProxyFactory;