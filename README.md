# echo-sonos
All of the pieces for an Amazon Echo (Alexa) <-> Sonos integration.

# Usage

Global commands (no rooms required):

* Presets: "Alexa, ask sonos to play Rock"
* Pause all: "Alexa, ask sonos to pause all"
* Resume all: "Alexa, ask sonos to resume all"

Room-specific commands, where "ROOM" could be any of your sonos room names (eg Kitchen, Master Bedroom, and so on):

* Play songs from an artist: "Alexa, ask sonos to play ARTIST NAME in the ROOM"
* Play a song: "Alexa, ask sonos to play SONG NAME in the ROOM"
* Play a specific artist's song: "Alexa, ask sonos to play ARTIST NAME SONG NAME in the ROOM"
* Play "radio" songs like this artist: "Alexa, ask sonos to play ARTIST NAME radio in the ROOM"
* Play "radio" songs like this track: Alexa, ask sonos to play SONG NAME radio in the ROOM"
* Play "radio" songs like this track from a specific artist: "Alexa, ask sonos to play ARTIST NAME SONG NAME radio in the ROOM"
* Play more "radio" songs like this song: "Alexa, play more songs by this artist in the ROOM"
* Play more "radio" songs like this track: "Alexa, play more songs like this in the ROOM"
* SiriusXM: "Alexa, play SiriusXM channel CHANNEL in the ROOM"
* SiriusXM: "Alexa, play SiriusXM station STATION in the ROOM"
* Playlists: "Alexa, ask sonos to start playlist MY PLAYLIST in the ROOM"
* Favorites: "Alexa, ask sonos to play favorite MY FAVORITE in the ROOM"
* Next: "Alexa, ask sonos go to the next track in the ROOM"
* Previous: "Alexa, ask sonos to go back in the ROOM"
* What's playing: "Alexa, ask sonos what's playing in the ROOM"
* Pause: "Alexa, ask sonos to pause in the ROOM"
* Resume: "Alexa, ask sonos to resume in the ROOM"
* Mute: "Alexa, ask sonos to mute in the ROOM"
* Unmute: "Alexa, ask sonos to unmute in the ROOM"
* Repeat: "Alexa, ask sonos to turn repeat [on,off] in the ROOM"
* Shuffle: "Alexa, ask sonos to turn shuffle [on,off] in the ROOM"
* Crossfade: "Alexa, ask sonos to turn crossfade [on,off] in the ROOM"
* Clear queue: "Alexa, ask sonos to clear the queue in the ROOM"
* Volume up or down (single room): "Alexa, ask sonos to turn it [up,down] in the ROOM"
* Volume up or down (all in group): "Alexa, ask sonos to turn it [up,down] in the ROOM group"
* Set volume (single room): "Alexa, ask sonos to change the volume to 22 in the ROOM"
* Set volume (all in group): "Alexa, ask sonos to change the volume to 22 in the ROOM group"
* Add room to the group: "Alexa, ask sonos to join NEW_ROOM to the ROOM"
* Remove room from the group: "Alexa, ask sonos to ungroup ROOM"
* Set speaker line-in: "Alexa, ask sonos to set ROOM line-in to the LINEIN_ROOM"
* Many other natural phrasings are supported for each command. The file "echo/utterances.txt" has all of the examples.

Everything's dynamic - rooms and playlists are taken dynamically from your speech. There are common room names in utterances.txt to help the Alexa engine recognize valid entries, but it's not necessary to add more. You can specify a default room in options.js and that room will be used when no room is specified in the utterance. You can also specify a default service in options.js to be used for the music search functionality which supports Apple Music, Spotify, Deezer, Deezer Elite, and the local Sonos music library. The default for the music service is to use the presets.

### Advanced Mode
Turning on Advanced Mode in options.js will allow you to dynamically change the current room and/or current music service through utterances (below). The solution will also remember the last room that was used in a normal command and set the current room to that room.

* Change room: "Alexa, ask sonos to change room to ROOM"
* Change service: "Alexa, ask sonos to change music to SERVICE" (SERVICE = Presets, Library, Apple, Spotify, Deezer, or Elite)
* Change room and service: "Alexa, ask sonos to change room to ROOM and music to SERVICE"

The service is also smart enough to control your whole group when given only a room name, even if that room isn't the Sonos coordinator, so you can change the volume in an entire group without having to remember which speaker is the coordinator.

### Advanced Line-In

if you have a default line-in (e.g. it has a dot connected) then you can set defaultLinein in options.js to this ROOM. This will open up:

* Play in room: "Alexa, ask sonos to play in ROOM"

This will set ROOM line-in to the default line-in (and play it)

# How it works

1. When you say the command to Alexa, it triggers the Alexa skill with invocation name sonos.
2. The Alexa skill calls a web service running on AWS Lambda, passing it the preset name ("rock" in the example).
3. Lambda then fires an HTTP request to a node.js server running node-sonos-http-api on your local network.
4. node-sonos-http-api interprets the command and relays to Sonos over your local network.

Included here are the Alexa API definitions, the Lambda AWS service that catches the Alexa requests, and an example preset configuration for jishi's node-sonos-http-api to actually play the music.

To set it up, you need to do the following:

# Get jishi's node-sonos-http-api working
1. Install node.js on a server on the same network as your Sonos.
2. Grab https://github.com/jishi/node-sonos-http-api and run it on that server.  On Mac, it's "npm install https://github.com/jishi/node-sonos-http-api", then go to the directory created and "npm start".
3. Take the node-sonos-http-api/presets.json that I have here and drop it into your node-sonos-http-api root directory. Modify it to use your speaker names and your favorite stations. Make sure the preset names are lowercase (like "test" and "rock" in my example). NOTE: You can skip this step if you only want to use Playlists and Favorites, which require no configuration.
4. Test it by hitting http://yourserverip:5005/zones
5. If you get a response, great! Now try playing something: http://yourserverip:5005/preset/[your_preset_name]. Or, play a Playlist or Favorite (example: http://yourserverip:5005/kitchen/playlist/myplaylist). To stop, use /pauseall.
6. If you have problems, make sure you are on the same network as your Sonos AND make sure you don't have a Sonos client running on the same machine. The client can interfere with the node.js server.

# Expose your server to the outside world
1. You need some way for Lambda to contact your server consistently. Services like DynDns and yDNS.eu will give you a consistent hostname for the outside world to use.  If you have an Asus router like I do, then dynamic DNS is actually a built-in / free feature.
2. On your local router, find the "Port Forwarding" configuration. Forward all inbound requests to 5005 (or configure some other port) to your node server.
3. Make sure your server has a locally static IP, so port forwarding doesn't lose track of it.
4. Setup your server to auto-start or daemonize the node-sonos-http-api server.
5. Test it by hitting http://yourdyndnsaddress:5005/zones.

# Create the Alexa Skill that will send events to AWS Lambda
1. Create a new Skill in the [Alexa Skills control panel](https://developer.amazon.com/edw/home.html) on Amazon. You need a developer account to do this. The account must be the same as bound to your Echo, and make sure you are logged into that account on amazon.com. You will see an error indicating access denied if the two accounts are different.
2. Name can be whatever you want. "Invocation" is what you say, and it must be all lowercase (I used "sonos").
3. Check Custom Interaction Model if it is not already checked. Click Next
4. Click Next, taking you to Interaction Model. Create a Custom Slot Type ("Add Slot Type"). Add a new types for PRESETS, ROOMS, SXMCHANNELS, SXMSTATIONS, SERVICES, TOGGLES and a final one for NAMES. Into each, copy/paste the contents of [echo/custom_slots/PRESETS.slot.txt](https://raw.githubusercontent.com/rgraciano/echo-sonos/master/echo/custom_slots/PRESETS.slot.txt), [echo/custom_slots/ROOMS.slot.txt](https://raw.githubusercontent.com/rgraciano/echo-sonos/master/echo/custom_slots/ROOMS.slot.txt), [echo/custom_slots/SXMCHANNELS.slot.txt](https://raw.githubusercontent.com/rgraciano/echo-sonos/master/echo/custom_slots/SXMCHANNELS.slot.txt),
[echo/custom_slots/SXMSTATIONS.slot.txt](https://raw.githubusercontent.com/rgraciano/echo-sonos/master/echo/custom_slots/SXMSTATIONS.slot.txt),
[echo/custom_slots/SERVICES.slot.txt](https://raw.githubusercontent.com/rgraciano/echo-sonos/master/echo/custom_slots/SERVICES.slot.txt),
[echo/custom_slots/TOGGLES.slot.txt](https://raw.githubusercontent.com/rgraciano/echo-sonos/master/echo/custom_slots/TOGGLES.slot.txt), and
[echo/custom_slots/NAMES.slot.txt](https://raw.githubusercontent.com/rgraciano/echo-sonos/master/echo/custom_slots/NAMES.slot.txt).
5. Still in Interaction Model, copy this repo's [echo/intents.json](https://raw.githubusercontent.com/rgraciano/echo-sonos/master/echo/intents.json) into the "Intent Schema" field, and [echo/utterances.txt](https://raw.githubusercontent.com/rgraciano/echo-sonos/master/echo/utterances.txt) into "Sample Utterances".
6. Don't test yet, just save. Click back to "Skill Information" and copy the "Application ID". You'll need this for Lambda.

# Configure the AWS Lambda service that will trigger your node-sonos-http-api server
1. Create an AWS Lambda account if you don't have one already. It's free!
2. In the Lambda console, look to the upper right. Make sure "N. Virginia" or one of the Lambda supported regions is selected, because not every zone supports Alexa yet.
3. Create a new Lambda function. Skip the blueprint.
4. Pick any name you want, and choose runtime Node.js.
5. Go into this repo's [lambda/src](lambda/src) directory and copy options.example.js to options.js.
 - Do not edit options.js you can customize using environment variables when you uplodad to lambda
6. In lambda/src, zip up everything. On Mac/Linux, `cd src; chmod a+r *.js; zip src.zip *.js`.  Make sure you don't capture the folder, just the files.
7. Choose to upload the zip file for src.zip.
7. In the environment variables section make sure to fill in the following environment variable
 - `APPID` - this is the Application ID you copied from above
 - `HOST`  - this is the DNS name for your server hosting node-sonos-http-api
7. You may optionally fill in any of the following environment variables
 - `AUTH_USERNAME` and `AUTH_PASSWORD` for basic auth with node-sonos-http-api
 - `USE_HTTPS` if you enabled https on node-sonos-http-api
 - `REJECT_UNAUTHORIZED` if you enabled https and used a self signed certificate
 - `DEFAULT_MUSIC_SERVICE` if you'd like to set a specific music service
 - `ADVANCED_MODE` for enabling advanced mode
 - `USE_SQS` if you are using node-sqs-proxy for secure communications
8. The default handler is fine. Create a new role of type Basic Execution Role. Pick smallest possible memory and so on.
9. Click Next to proceed. Once created, click "Triggers".
10. Add a source.  Choose "Alexa Skills Kit".
11. Test it out. I included a test blueprint in this repo. Click "Test" and copy/paste this repo's [lambda/play_intent_testreq.json](https://raw.githubusercontent.com/rgraciano/echo-sonos/master/lambda/play_intent_testreq.json) to test. It will trigger the "test" preset in your presets.json file on your Sonos server. Don't forget to replace the Alexa App Id again.
12. For Advanced Mode you also need to give Lambda permission to access DynamoDB for storing the current room and service settings. Simply click on your AWS Dashboard account name in the upper right corner, Security Credentials, close the popup message, click Roles on the left, click on lambda_basic_execution, click Attach Policy, click the checkboxes next to AmazonDynamoDBFullAccess and AmazonSQSFullAccess, and click Attach Policy at the bottom of the screen.

# Connect Alexa Skill to AWS Lambda
1. In the Lambda console, copy the long "ARN" string in the upper right.  
2. Go back into the Alexa Skill console, open your skill, click "Skill Information", choose Lambda ARN and paste that ARN string in.
3. Now you're ready to put it all together. Try "Alexa, ask sonos to play test"

# Optional "Advanced Mode" (enable in options.js)
Advanced Mode comes with two major new features.  First, it supports music streaming services like Apple Music, Spotify, and Deezer.   And second, it remembers the room you're operating in, so you no longer need to include a room on every utterance.  With Advanced Mode turned on, you can request specific songs and albums.

The following apply to "Advanced Mode" in options.js:

  advancedMode: true              // Allows you to specify and change default rooms and music services. Requires additional AWS setup
  defaultRoom: 'Kitchen',	      // Allows you to specify a default room to use when one is not specified in the utterance 	
  defaultMusicService: 'apple',   // Supports presets, library, apple, spotify, deezer, or elite  (elite = Deezer Elite FLAC)

# Optional Security Features
The echo-sqs-proxy solution allows Echo-Sonos to communicate with the node-sonos-http-api solution without having to alter your firewall to open your server to the Internet or having to make any of the changes below.  Read the README file in the echo-sqs-proxy directory for instructions.

Alternatively, if you're not using echo-sqs-proxy, echo-sonos does support both HTTPS and basic auth.  options.example.js has flags and configuration information for both features. For HTTPS support, set "useHttps" to "true" and check to make sure the port is still correct.  For basic auth, change the "auth" variable and replace the username and password with your own.

## Configuring node-sonos-http-api
Securing node-sonos-http-api, HTTPS, and your home server are outside the bounds of this project. The below documentation is provided for convenience because so many people have asked me about it.  You could certainly do much more to secure your home server.  For starters, you could pin certificates to the client or put more effort behind secure key and credential storage.  This is a DIY hobbyist project, and it's up to your discretion to determine how much effort to put into security.

Both HTTPS and basic auth need to be configured on node-sonos-http-api before echo-sonos can use them.  You can configure one without the other, but they are recommended together.  In your node-sonos-http-api directory, create a file called settings.json according to the node-sonos-http-api documentation.  

An example might look like this:

    {
        "port": 5004,
        "securePort": 5005,

        "https": {
            "key": "/home/pi/node-sonos-http-api/yourserver.key",
            "cert": "/home/pi/node-sonos-http-api/yourserver.crt"
        },

        "auth": {
            "username": "yourusernamegoeshere",
            "password": "yourpasswordgoeshere"
        }
    }

## Certificate creation
In the above example, HTTPS is configured using "yourserver.key" and "yourserver.crt".  For utmost security, it's best to purchase a certificate from a reputable certificate authority such as [Digicert](https://www.digicert.com).  You could also use a free one from a service like [LetsEncrypt.org](https://letsencrypt.org).  A final option for those who know what they're doing is to self-sign, and if you choose this route, then you must set "rejectUnauthorized" to "false" in options.js.

# Troubleshooting
1. If you have trouble with your node server not triggering the music even when you hit it on localhost, it probably can't find Sonos. If it crashes with a message about "discovery" being "null" then that's definitely the case. Usually you're on the wrong wifi network, you forgot to close your Sonos application (which screws everything up), or your server died for some reason and you didn't notice.
2. If your Lambda test doesn't work, then you might have a case mis-match between the preset name in presets.json and the value in the Lambda test. It's also possible Lambda can't reach your host because your DynDNS setup isn't working, or a firewall is blocking it. If you're unsure, try the Maker plugin on IFTTT, to see if you can get it working externally from someplace else.
3. If Alexa says something about not being able to use your skill, then Lambda is probably returning an error. Check the Lambda logs. Alexa will say this if she doesn't see a proper response from the Lambda server.
4. If you run into a syntax error on node-sonos-http-api that looks something like "Syntax error in module 'index': SyntaxError at exports.runInThisContext", then it's likely that you inadvertently edited presets.json with a rich text editor and it replaced some of your quotation marks with quotes from a weird character set.  Try pasting your presets.json into a JSON linter like [jsonlint.com](http://www.jsonlint.com) and it should point out this error.
5. If you have trouble with Alexa recognizing commands, make sure you say "Alexa ask sonos" rather than some of the other possibilities (like "Alexa tell sonos"). Many people report that "ask" works better than "tell", and (strangely) that a lowercase invocation name ("sonos") is better than its camelcase variant ("Sonos").

If you're still stuck, add a comment on my original [Amazon Echo + Sonos integration](http://ryangraciano.com/post/124770680942/controlling-sonos-with-amazon-echo) blog post and I'll try to help you out.

# Upgrade Checklist
When upgrading your code to the latest version, make sure you do the following:

1. In the Interaction Model under the Alexa Skills Kit console, update the Intents, the Utterances, and the two Custom Slot Types
2. Zip all of the .js files (without the folder - just the .js) and update them in Lambda

# Contributing
Lots of people are forking echo-sonos, which is awesome. I'd love to bring some of that innovation back into the project, so don't be shy about submitting pull requests!

# Acknowledgements
Thanks to [@jishi](https://github.com/jishi) for [node-sonos-http-api](https://github.com/jishi/node-sonos-http-api), without which none of this would be possible.  And major credit goes to [@jplourde5](https://github.com/jplourde5) for a slew of big features, like music services and echo-sqs-proxy.
