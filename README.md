# echo-sonos
All of the pieces for an Amazon Echo (Alexa) <-> Sonos integration.

Here's how it's used:

1. I pre-define typical use-cases for my Sonos, like playing my Rock favorite on all speakers at typical volume
2. I say "Alexa, use Sonos to play Rock"
 
Global commands (no rooms required):

* Presets: "Alexa, tell Sonos to play Rock"
* Pause all: "Alexa, tell Sonos to pause"
* Resume all: "Alexa, tell Sonos to resume"

Room-specific commands, where "ROOM" could be any of your Sonos room names (eg Kitchen, Master Bedroom, and so on):

* Playlists: "Alexa, tell Sonos to start playlist MY PLAYLIST in the ROOM"
* Favorites: "Alexa, tell Sonos to play favorite MY FAVORITE in the ROOM"
* Next: "Alexa, tell Sonos go to the next track in the ROOM"
* Previous: "Alexa, tell Sonos to go back in the ROOM"
* What's playing: "Alexa, ask Sonos what's playing in the ROOM"
* Mute: "Alexa, tell Sonos to mute in the ROOM"
* Unmute: "Alexa, tell Sonos to unmute in the ROOM"
* Volume up or down (single room): "Alexa, tell Sonos to turn it [up,down] in the ROOM"
* Volume up or down (all in group): "Alexa, tell Sonos to turn it [up,down] in the ROOM group"
* Set volume (single room): "Alexa, tell Sonos to change the volume to 22 in the ROOM"
* Set volume (all in group): "Alexa, tell Sonos to change the volume to 22 in the ROOM group"

* Many other natural phrasings are supported for each command. The file "echo/utterances.txt" has all of the examples.

When you say the command to Alexa, it triggers the Alexa skill with invocation name Sonos. The Alexa skill calls a web service running on AWS Lambda, passing it the preset name ("rock" in the example). Lambda then fires an HTTP request to a node.js server running node-sonos-http-api on your local network. node-sonos-http-api gathers all of the settings from the preset named "rock" in presets.json, sending them all to Sonos over your local network.

Included here are the Alexa API definitions, the Lambda AWS service that catches the Alexa requests, and an example preset configuration for jishi's node-sonos-http-api to actually play the music.

To set it up, you need to do the following:

# Get jishi's node-sonos-http-api working
1. Install node.js on a server on the same network as your Sonos.
2. Grab https://github.com/jishi/node-sonos-http-api and run it on that server.
3. Take the node-sonos-http-api/presets.json that I have here and drop it into your node-sonos-http-api root directory. Modify it to use your speaker names and your favorite stations. Don't worry about the "uri" field - it's unused. Make sure the preset names are lowercase (like "test" and "rock" in my example).
4. Test it by hitting http://yourserverip:5005/zones
5. If you get a response, great! Now try playing something: http://yourserverip:5005/preset/[your_preset_name]. To stop, use /pauseall.
6. If you have problems, make sure you are on the same network as your Sonos AND make sure you don't have a Sonos client running on the same machine. The client can interfere with the node.js server.

# Expose your server to the outside world
1. You need some way for Lambda to contact your server consistently. Services like DynDns and yDNS.eu will give you a consistent hostname for the outside world to use.  If you have an Asus router like I do, then dynamic DNS is actually a built-in / free feature.
2. On your local router, find the "Port Forwarding" configuration. Forward all inbound requests to 5005 (or configure some other port) to your node server.
3. Make sure your server has a locally static IP, so port forwarding doesn't lose track of it.
4. Setup your server to auto-start or daemonize the node-sonos-http-api server.
5. Test it by hitting http://yourdyndnsaddress:5005/zones.

# Create the Alexa Skill that will send events to AWS Lambda
1. Create a new Skill in the Alexa Skills control panel on Amazon. You need a developer account to do this.
2. Name can be whatever you want. "Invocation" is what you say (I used "Sonos").
3. Put a dummy value in the Endpoint. We'll come back to this.
4. Click Next, taking you to Interaction Model. Copy this repo's "echo/intents.json" into the "Intent Schema" field, and "echo/utterances.txt" into "Sample Utterances".
5. Still in Interaction Model, create a Custom Slot Type ("Add Slot Type"). Add a new type for PRESETS and another for ROOMS. Into each, copy/paste the contents of "echo/custom_slots/PRESETS.slot.txt" and "echo/custom_slots/ROOMS.slot.txt".
6. Don't test yet, just save. Click back to "Skill Information" and copy the "Application ID". You'll need this for Lambda.

# Configure the AWS Lambda service that will trigger your node-sonos-http-api server
1. Create an AWS Lambda account if you don't have one already. It's free!
2. In the Lambda console, look to the upper right. Make sure "N. Virginia" is selected, because not every zone supports Alexa yet.
3. Create a new Lambda function. Skip the blueprint. 
4. Pick any name you want, and choose runtime Node.js.
5. Go into this repo's "lambda/src" directory and copy options.example.js to options.js. Edit options.js to have your DynDNS hostname, your port, and the Alexa App ID you just copied.
6. In lambda/src, zip up everything. On Mac, "cd src; zip -r src.zip *.js".  Make sure you don't capture the folder, just the files.
7. Choose to upload the zip file for src.zip.
8. The default handler is fine. Create a new role of type Basic Execution Role. Pick smallest possible memory and so on.
9. Click Next to proceed. Once created, click "Event Sources".
10. Add a source.  Choose "Alexa Skills Kit".
11. Test it out. I included a test blueprint in this repo. Click "Test" and copy/paste this repo's "lambda/play_intent_testreq.json" to test. It will trigger the "test" preset in your presets.json file on your Sonos server. Don't forget to replace the Alexa App Id again.

# Connect Alexa Skill to AWS Lambda
1. In the Lambda console, copy the long "ARN" string in the upper right.  
2. Go back into the Alexa Skill console, open your skill, click "Skill Information", choose Lambda ARN and paste that ARN string in.
3. Now you're ready to put it all together. Try "Alexa, use Sonos to play test"

# Optional Server Setup
The files in the server folder are shell scripts to automatically update the server when the presets file is changed. There are 2 versions, a generic version and the a version for use on a Raspberry Pi. Both versions require the installation of `inotify-tools`.

1\. Copy the shell scripts to your server

2\. Add the following lines to /etc/rc.local before `exit 0`


    node /[dir]/[to]/node-sonos-http-api-master/server.js&
    echo "started node" > /[log location]/startup.log
    bash /[dir]/[to]/daemon.sh&
    echo "started daemon" > /[log location]/startup.log

For example, on Raspberry Pi it might look like:

    node /home/pi/node-sonos-http-api-master/server.js&
    echo "started node" > /home/pi/startup.log
    bash /home/pi/daemon.sh&
    echo "started daemon" > /home/pi/startup.log

3\. Restart the server

# Troubleshooting
1. If you have trouble with your node server not triggering the music even when you hit it on localhost, it probably can't find Sonos. If it crashes with a message about "discovery" being "null" then that's definitely the case. Usually you're on the wrong wifi network, you forgot to close your Sonos application (which screws everything up), or your server died for some reason and you didn't notice.
2. If your Lambda test doesn't work, then you might have a case mis-match between the preset name in presets.json and the value in the Lambda test. It's also possible Lambda can't reach your host because your DynDNS setup isn't working, or a firewall is blocking it. If you're unsure, try the Maker plugin on IFTTT, to see if you can get it working externally from someplace else.
3. If Alexa says something about not being able to use your skill, then Lambda is probably returning an error. Check the Lambda logs. Alexa will say this if she doesn't see a proper response from the Lambda server.

If you're still stuck, add a comment on my original [Amazon Echo + Sonos integration](http://ryangraciano.com/post/124770680942/controlling-sonos-with-amazon-echo) blog post and I'll try to help you out.

# Upgrade Checklist
When upgrading your code to the latest version, make sure you do the following:

1. In the Interaction Model under the Alexa Skills Kit console, update the Intents, the Utterances, and the two Custom Slot Types
2. Zip all of the .js files (without the folder - just the .js) and update them in Lambda

# Contributing
Lots of people are forking echo-sonos, which is awesome. I'd love to bring some of that innovation back into the project, so don't be shy about submitting pull requests!
