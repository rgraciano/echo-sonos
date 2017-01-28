'use strict';

var AWS = require('aws-sdk');

var sqsClient = {};
var region = process.env.AWS_REGION;	
var sqsServerProxy = new AWS.SQS({region : region});
var sqsClientProxy = new AWS.SQS({region : region});


sqsClient.get = function(baseSqsUrl, path) {
    var response = null;
    var serverUrl = baseSqsUrl + "/SQS-Proxy-Server";
    var clientUrl = baseSqsUrl + "/SQS-Proxy-Client";

    return  purgeQueue(serverUrl) //Delete all messages from queue
            .then(sendMessage(clientUrl, path)) 
            .catch(sendMessage(clientUrl, path)) //Send messages even if purge fails
            .then(receiveMessage(serverUrl)) //Read response
            .then((data) => {
                var message = data.Messages[0];
                response = message.Body;

                return deleteMessage(serverUrl, message); //Delete message that was just read
            }).then(() => {
                return response; //return data
            });
};


function purgeQueue(serverUrl){
    var promise = convertToPromise(sqsServerProxy, sqsServerProxy.purgeQueue, {QueueUrl:serverUrl})

    promise.then(() => console.log('SQS queue purged'))
           .catch(() => console.log('SQS queue not purged'));

    return promise;
}

function sendMessage(clientUrl, path){
    var promise = convertToPromise(sqsClientProxy, sqsClientProxy.sendMessage, {'MessageBody': path, 'QueueUrl': clientUrl});

    //curry
    return (() => {return promise});
}

function receiveMessage(serverUrl){
    var promise = convertToPromise(sqsServerProxy, sqsServerProxy.receiveMessage, {	
								QueueUrl: serverUrl,
								MaxNumberOfMessages: 1, // how many messages do we wanna retrieve?
								VisibilityTimeout: 60, // seconds - how long we want a lock on this job
								WaitTimeSeconds: 20 // seconds - how long should we wait for a message?
    });

    //curry
    return (() => {return promise});
}

function deleteMessage(serverUrl, message){
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