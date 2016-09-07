const Consumer = require('sqs-consumer');
const request = require('request');
const AWS = require('aws-sdk');
const async = require('async');
const path = require('path');
const settings = require(path.resolve(__dirname, 'settings.json'));

var prevId = '';
var clientUrl = '';
var serverUrl = '';

try {
	AWS.config.loadFromPath(path.resolve(__dirname, 'settings.json'));

	var sqsClient = new AWS.SQS();

	sqsClient.createQueue({QueueName: "SQS-Proxy-Client"}, function(err, data) {
   		if (err) console.log(err, err.stack); // an error occurred
   		else {
			clientUrl= data.QueueUrl;           // successful response

			var sqsServer = new AWS.SQS();

			sqsServer.createQueue({QueueName: "SQS-Proxy-Server"}, function(err, data) {
   				if (err) console.log(err, err.stack); // an error occurred
   				else {
					serverUrl= data.QueueUrl;           // successful response

					var app = Consumer.create({
  						region:   settings.region,
  						queueUrl: clientUrl,
  						handleMessage: function (message, done) {
    						if (message.MessageId != prevId) {
								var url = "http://" + settings.host + ":" + settings.port + message.Body;
console.log("=>" + url);
								prevId = message.MessageId;
								request(url, function (error, response, body) {
  									if (!error) {
    									console.log(body) // Show the HTML for the Google homepage.
		    							sqsServer.sendMessage(
		    								{
	  											MessageBody: body,
  												QueueUrl: serverUrl
		    								}, 
		    								function(err, data) {
  												if (err) {
    												console.log('ERR1 ', err);
  												}
  											}
										);
  									} else {
  										console.log("ERR2 " + error); 
  									}
								});
							}
    						done();
  						},
  						sqs: new AWS.SQS()
					});

					app.on('error', function (err) {
  						console.log(err.message);
					});

					app.start();
   				}
			});
  		 }
	});


} catch(err) {
	console.log(err.message);
}