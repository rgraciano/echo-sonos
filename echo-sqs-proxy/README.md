
ECHO SQS PROXY
==============

A simple solution that allows Echo-Sonos to communicate with node-sonos-http-api without 
having to make any adjustments to your firewall.  The solution uses AWS SQS queues to 
communicate with a client that then converts the communication to http calls sent to the
node-sono-http-api. No changes are required to be made to the api solution. The  proxy 
can simply be installed on the same node.js server that is hosting the api solution, or it 
can be installed on a different server.

INSTALLATION
============
Get the latest version of echo-sonos and install it if you haven't done so 
already. Make sure it's up to date, then copy the echo-sqs-proxy folder from the echo-sonos directory to the same server 
running node-sonos-http-api.

Fix your dependencies by invoking the following command while in the echo-sqs-proxy 
directory:

`npm install --production`

This will download the necessary dependencies if possible.

Logon to your AWS dashboard at aws.amazon.com to be able to retrieve some needed 
information.

In the echo-sqs-proxy directory on your server, copy the settings.example.json file to settings.json, then edit the 
settings.json file to specify your account information:

```
{
  "region": "YOUR_REGION_CODE",
  "accessKeyId": "YOUR_ACCESS_KEY_ID",
  "secretAccessKey": "YOUR_SECRET_ACCESS_KEY",
  "host": "localhost",
  "port": "5005"
}
```

The region should be the AWS region where your are running your Echo Lambda function. You 
can look in the upper right corner of your AWS dashboard to find the region description. 
Use the CODE from below, NOT the description.  Current codes for Lambda are:

```
Description              CODE
US East (N. Virginia)    us-east-1
US West (Oregon)         us-west-2
Asia Pacific (Singapore) ap-southeast-1
Asia Pacific (Sydney)    ap-southeast-2	
Asia Pacific (Tokyo)     ap-northeast-1	
EU (Frankfurt)           eu-central-1	
EU (Ireland)             eu-west-1
```

The access key information can be retrieved by creating and DOWNLOADING new credentials. 
Click your name in the upper right of the dashboard, Security Credentials, Access 
Keys, Create New Access Key.  Be sure to download your keys which will be saved to a CSV 
file. You will not be able to get your secret key again. You will have to create new 
keys if you do not have your secret key. Both the accessKeyId and the secretAccessKey can 
be retrieved from the downloaded CSV file and used provide the needed settings 
information.

The host value can be left as localhost if you are installing the the solution on the same 
server hosting the api, or a different host or IP can be specified if it will be installed
on a different server.

The port can be left as the node-sonos-http-api default port of 5005, or something else 
if a different port was used for the api.

Save the settings file in your echo-sqs-proxy directory on your server.

If you did not add the AmazonSQSFullAccess policy to the Lambda role earlier while 
installing Echo-Sonos, then while still in the AWS dashboard in the Security Credentials 
screen, click Roles, lambda_basic_execution, Attach Policy, select AmazonSQSFullAccess,
and click Attach Policy. 

Start the server by running

`npm start`

If you don't see any errors, then everything should be ready and the queues will have been
created.

Next, update your Lambda Environment Variables to use SQS

- `USE_SQS` set to `true`

Your echo-sonos solution should now use AWS SQS queues for communication and you can
remove any port forwarding that you had on your firewall for node-sonos-http-api if you
modified your firewall previously.

