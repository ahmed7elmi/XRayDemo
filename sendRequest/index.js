let AWSXRay = require('aws-xray-sdk-core');
//AWSXRay.enableManualMode();
let AWS = AWSXRay.captureAWS(require('aws-sdk'));
AWS.config.update({region: process.env.AWS_REGION});

exports.handler = function (event, context, callback) {
    let segment = AWSXRay.getSegment();
    console.log(process.env.REQUESTS_QUEUE_URL);
    const sqs = new AWS.SQS();

    // enqueue the request in SQS Queue
    let randomValue = Math.floor(Math.random() * 10000);
    segment.addAnnotation('msg_id', randomValue);
    segment.addMetadata('event_data', event);
    console.log(JSON.stringify(segment, null, 2));
    let params = {
        DelaySeconds: 0,
        MessageBody: `value=${randomValue}`,
        QueueUrl: process.env.REQUESTS_QUEUE_URL
    };

        sqs.sendMessage(params, function (err, response){
            if (err) {
                console.log(err);
                return callback(err);
            }
            console.log('enqueued');
            return callback(null, {
                statusCode: 200,
                body: 'Ok'
            });
        });
}