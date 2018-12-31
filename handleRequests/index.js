const uuidv4 = require('uuid/v4');
let AWSXRay = require('aws-xray-sdk-core');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

AWS.config.update({region: process.env.AWS_REGION});
const ddbOptions = {
    region: process.env.AWSREGION,
    apiVersion: '2012-08-10'
};
const sqs = new AWS.SQS();

const messageHandler = function (message) {
    return new Promise( (resolve, reject) => {
        const ddb = new AWS.DynamoDB(ddbOptions);
        let params = {
            TableName: 'MessagesStore',
            Item: {
                RequestID: {
                    S: uuidv4()
                },
                Data: {
                    S: message.Body
                }
            }
        };
        ddb.putItem(params, function(err, _) {
            if (err) {
                reject(err);
            } else {
                let delParams = {
                    QueueUrl: process.env.REQUESTS_QUEUE_URL,
                    ReceiptHandle: message.ReceiptHandle
                };
                // TODO: the delete message call will not block here, should we promisify it?
                sqs.deleteMessage(delParams, (err, delResponse) => {
                    if (err) {
                        console.log(err);
                        return reject(err);
                    }
                    console.log(JSON.stringify(delResponse, null, 2));
                });
                resolve(message);
            }
        });
    });
}

exports.handler = function (event, context, callback) {
    console.log(process.env.REQUESTS_QUEUE_URL);

    // AWSXRay.captureFunc('annotations', )

    // enqueue the request in SQS Queue
    let randomValue = Math.floor(Math.random() * 10000);
    let params = {
        QueueUrl: process.env.REQUESTS_QUEUE_URL,
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 30
    };
    sqs.receiveMessage(params, function (err, data){
        if (err) {
            console.log(err);
            return callback(err);
        }
        if (data.Messages) {
            console.log(`Messages received, Count = ${data.Messages.length}`);
            
            let promises = data.Messages.map(messageHandler);
    
            Promise.all(promises).then( () => {
                return callback(null, {
                    statusCode: 200,
                    body: 'Ok'
                });
            }).catch( (err) => { return callback(err) });
        }
        
        // return callback(null, {
        //     statusCode: 200,
        //     body: 'Ok'
        // });
    });
}
