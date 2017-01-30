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
    var result = convertToPromise(sqsServerProxy, sqsServerProxy.purgeQueue, {QueueUrl:serverUrl})

    var promise = new Promise((resolve, reject) => {
                     result.then(() => {
                            console.log('SQS purged queue');
                            resolve();
                     })
                     .catch(() => {
                            console.log(`SQS didn't purged queue`);
                            resolve();
                    });
    });

    return promise;
}

function sendMessage(clientUrl, path){

    //curry
    return (() => {
        var promise = convertToPromise(sqsClientProxy, sqsClientProxy.sendMessage, {'MessageBody': path, 'QueueUrl': clientUrl});

        promise.then(() => console.log(`SQS successfully sent message ${path}`))
               .catch(() => console.log(`SQS failed to send message ${path}`)); 

        return promise
    });
}

function receiveMessage(serverUrl){
    
    //curry
    return (() => {
        var promise = convertToPromise(sqsServerProxy, sqsServerProxy.receiveMessage, {	
								QueueUrl: serverUrl,
								MaxNumberOfMessages: 1, // how many messages do we wanna retrieve?
								VisibilityTimeout: 60, // seconds - how long we want a lock on this job
								WaitTimeSeconds: 20 // seconds - how long should we wait for a message?
        });

        promise.then(() => console.log(`SQS successfully received response`))
               .catch(() => console.log(`SQS failed to receive response`)); 

        return promise;
    });
}

function deleteMessage(serverUrl, message){
    var promise = convertToPromise(sqsServerProxy, sqsServerProxy.deleteMessage, {QueueUrl: serverUrl, ReceiptHandle: message.ReceiptHandle});

    promise.then(() => console.log(`SQS successfully disposed message`))
           .catch(() => console.log(`SQS failed to dispose message`)); 

    return promise;
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