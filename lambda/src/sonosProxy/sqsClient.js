'use strict';

var AWS = require('aws-sdk');

var region = process.env.AWS_REGION;
var arn = context.invokedFunctionArn;
var actLoc = arn.indexOf(region) + region.length + 1;
var accountId = arn.substring(actLoc,arn.indexOf(':',actLoc));
var baseSqsUrl = "https://sqs." + region + ".amazonaws.com/" + accountId;		
var serverUrl = baseSqsUrl + "/SQS-Proxy-Server";
var clientUrl = baseSqsUrl + "/SQS-Proxy-Client";
var sqsServerProxy = new AWS.SQS({region : region});
var sqsClientProxy = new AWS.SQS({region : region});


sqsClient.get = function(path) {
    var response = null;

    return  purgeQueue() //Delete all messages from queue
            .then(sendMessage(path)) 
            .catch(sendMessage(path)) //Send messages even if perge fails
            .then(receiveMessage) //Read response
            .then((data) => {
                var message = data.Messages[0];
                response = message.Body;

                return deleteMessage(message); //Delete message that was just read
            }).then(() => {
                return response; //return data
            });
};


function purgeQueue(){
    return convertToPromise(sqsServerProxy, sqsServerProxy.purgeQueue, {QueueUrl:serverUrl});
}

function sendMessage(path){
    var promise = convertToPromise(sqsClientProxy, sqsClientProxy.sendMessage, {'MessageBody': path, 'QueueUrl': clientUrl});

    //curry
    return (() => {return promise});
}

function receiveMessage(){
    return convertToPromise(sqsServerProxy, sqsServerProxy.receiveMessage, {	
								QueueUrl: serverUrl,
								MaxNumberOfMessages: 1, // how many messages do we wanna retrieve?
								VisibilityTimeout: 60, // seconds - how long we want a lock on this job
								WaitTimeSeconds: 20 // seconds - how long should we wait for a message?
    });
}

function deleteMessage(message){
    return convertToPromise(sqsServerProxy, sqsServerProxy.deleteMessage, {QueueUrl: serverUrl, ReceiptHandle: message.ReceiptHandle});
}


function convertToPromise(obj, fn, payload) {
    var promise = new Promise((resolve, reject) => {
        fn.call(obj, payload, (error, data) => {
            if(error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });

    return promise;
}

module.exports = sqsClient;