'use strict';

/**
 *  TODO: Write real tests
 *  These tests were done quickly while deving
 */
console.log('Starting sonosProxyFactory tests');

var sonosProxyFactory = require('./../src/sonosProxy/sonosProxyFactory');
var sonosProxy = sonosProxyFactory.get('http://localhost:5005');

Promise.resolve()
    .then(() => {
        console.log('Calling getZones');
        return sonosProxy.getZones().then((data) => console.log(data));
    })

    .then(() => {
        console.log('Calling getFavorites');
        return sonosProxy.getFavorites()
    })

    .then(() => {
        console.log('Calling getPlaylists');
        return sonosProxy.getPlaylists()
    })

    .then(() => {
        console.log('Calling pauseAll');
        return sonosProxy.pauseAll();
    })
    
    .then(() => {
        console.log('Calling pauseAll with timeout');
        return sonosProxy.pauseAll(1);
    })
    
    .then(() => {
        console.log('Calling resumeAll');
        return sonosProxy.resumeAll();
    })
    
    .then(() => {
        console.log('Calling resumeAll with timeout');
        return sonosProxy.resumeAll(1);
    })
    
    .then(() => {
        console.log('Calling preset by name');
        return sonosProxy.preset('test');
    })
    
    .then(() => {
        console.log('Calling preset by JSON');
        return sonosProxy.preset('{"players": [{ "roomName": "Kitchen", "volume": 30}], "state": "PAUSED", "pauseOthers": false}');
    })

    .then(() => {
        console.log('Calling sleep');
        return sonosProxy.sleep('1');
    })
    
    .then(() => {
        console.log('Calling play');
        return sonosProxy.play('Study');
    })

    .then(() => {
        console.log('Calling Pause');
        return sonosProxy.pause('Study');
    })

    .then(() => {
        console.log('Calling togglePlay');
        return sonosProxy.togglePlay('Study');
    })

    .then(() => {
        console.log('Calling say');
        return sonosProxy.say('Study','hello');
    })

    .then(() => {
        console.log('Calling lineIn');
        return sonosProxy.lineIn('Study','Living Room');
    });

     

