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

sonosProxy.zones = function() {
    var url = this.baseUrl + '/zones';
    return makeCall(url, this.useSqs);
};

sonosProxy.lineIn = function(room, lineIn) {
    var url = this.baseUrl + '/' + encodeURIComponent(room) + '/linein/' 
                + encodeURIComponent(lineIn);

    return makeCall(url, this.useSqs);
};

function makeCall(url, useSqs){
    
    if(useSqs){
        //TODO add sqs logic here
        return new Promise((resolve, reject) => reject('Not Implemented'));
    }

    return httpClient.get(url).then(() => console.log(`Call to '${url}' suceeded`), 
                                    (data) => console.log(`Call to '${url}' failed`));
}

module.exports = sonosProxyFactory;