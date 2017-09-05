//
// You should not have to change this file at all.  Instead, change the environment variables
// in Lambda. The README.md will walk you through this.
//
// This file remains for backward compatibility, and if you want to hardcode anything (for whatever reason).


// If you setup basic auth in node-sonos-http-api's settings.json, change the username
// and password here.  Otherwise, just leave this alone and it will work without auth.
var username = getDefault('AUTH_USERNAME', 'basic_auth_username');
var password = getDefault('AUTH_PASSWORD', 'basic_auth_password');

var auth = new Buffer(username + ":" + password).toString("base64");

var options = {
  appid: getDefault('APPID', 'yourappidhere'),
  host: getDefault('HOST', 'yourhosthere'),
  port: getDefault('PORT', '5005'),
  headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/json'
  },

  useHttps: getDefault('USE_HTTPS', false), // Change to true if you setup node-sonos-http-api with HTTPS
  rejectUnauthorized: getDefault('REJECT_UNAUTHORIZED', true), // Change to false if you self-signed your certificate
  defaultRoom: getDefault('DEFAULT_ROOM', ''),				        // Allows you to specify a default room when one is not specified in the utterance
  defaultMusicService: getDefault('DEFAULT_MUSIC_SERVICE', 'presets'), // Supports presets, apple, spotify, deezer, or library
  advancedMode: getDefault('ADVANCED_MODE', false),             // Allows you to specify and change default rooms and music services. Requires additional AWS setup
  useSQS: getDefault('USE_SQS', false),   // Use AWS SQS and node-sqs-proxy for secure communications
  defaultLinein: getDefault('DEFAULT_LINEIN', false)              // Allows you to specify a default Linein (e.g. with a dot connected) 
};

module.exports = options;


function getDefault(key, defaultVal) {
  if (typeof(process.env[key]) == 'undefined') { 
    return defaultVal;
  }
  else {
    // special case true and false because they need to be set to logical values, not strings
    if (process.env[key] == 'false') {
      return false
    }
    if (process.env[key] == 'true') {
      return true
    }
    return process.env[key];
  }
}
