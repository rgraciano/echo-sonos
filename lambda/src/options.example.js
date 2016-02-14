// If you setup basic auth in node-sonos-http-api's settings.json, change the username
// and password here.  Otherwise, just leave this alone and it will work without auth.
var auth = new Buffer("YOUR_USERNAME" + ":" + "YOUR_PASSWORD").toString("base64");

var options = {
  appid: "amzn1.echo-sdk-ams.app.ENTER_YOUR_APP_ID_FOR_ECHO_HERE",
  host: "host_for_sonos_api",
  port: "5005",
  headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/json'
  },
  useHttps: false, // Change to true if you setup node-sonos-http-api with HTTPS
  rejectUnauthorized: true, // Change to false if you self-signed your certificate
};

module.exports = options;

