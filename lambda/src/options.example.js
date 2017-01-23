// If you setup basic auth in node-sonos-http-api's settings.json, change the username
// and password here.  Otherwise, just leave this alone and it will work without auth.
var auth = new Buffer(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64");

var options = {
  appid: process.env.APPID,
  host: process.env.HOST,
  port: process.env.PORT || '5005',
  headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/json'
  },

  useHttps: process.env.USE_HTTPS || false, // Change to true if you setup node-sonos-http-api with HTTPS
  rejectUnauthorized: process.env.REJECT_UNAUTHORIZED || true, // Change to false if you self-signed your certificate
  defaultRoom: process.env.DEFAULT_ROOM || '',				        // Allows you to specify a default room when one is not specified in the utterance
  defaultMusicService: process.env.DEFAULT_MUSIC_SERVICE || 'presets', // Supports presets, apple, spotify, deezer, or library
  advancedMode: process.env.ADVANCED_MODE || false,             // Allows you to specify and change default rooms and music services. Requires additional AWS setup
  useSQS: process.env.USE_SQS || false,   // Use AWS SQS and node-sqs-proxy for secure communications
  defaultLinein: process.env.DEFAULT_LINEIN || false              // Allows you to specify a default Linein (e.g. with a dot connected) 
};

module.exports = options;

