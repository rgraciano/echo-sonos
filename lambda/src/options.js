// If you setup basic auth in node-sonos-http-api's settings.json, change the username
// and password here.  Otherwise, just leave this alone and it will work without auth.
var auth = new Buffer("admin" + ":" + "PCVista").toString("base64");

var options = {
  appid: "amzn1.echo-sdk-ams.app.amzn1.ask.skill.fd8bab1a-6071-4f45-98d2-4938e6f9278f",
  host: "172.10.168.65",
  port: "5005",
  headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/json'
  },
  useHttps: true, // Change to true if you setup node-sonos-http-api with HTTPS
  rejectUnauthorized: false, // Change to false if you self-signed your certificate
  defaultRoom: '',				        // Allows you to specify a default room when one is not specified in the utterance 	
  defaultMusicService: 'presets', // Supports presets, apple, spotify, deezer, or library
  advancedMode: false,             // Allows you to specify and change default rooms and music services. Requires additional AWS setup
  useSQS: false   // Use AWS SQS and node-sqs-proxy for secure communications
};

module.exports = options;

