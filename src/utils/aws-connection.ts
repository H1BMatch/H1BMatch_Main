const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

console.log('Setting up AWS connection...');

const ddb = new DynamoDBClient({ region: 'us-east-2' });

console.log('AWS connection setup complete.');

export { ddb };


