import json
import os
import boto3

TABLE_NAME = os.environ['TABLE_NAME']
PRIMARY_KEY = os.environ['PRIMARY_KEY'] 

def helloWorld(event, context): 
    dynamodb = boto3.client('dynamodb')
    element_count = dynamodb.describe_table(TableName=TABLE_NAME)['Table']['ItemCount']
    return {
        'statusCode': 200,
        'body': json.dumps(str(element_count) + " elements in the table."),
        'headers' : {
            'Cache-Control': 'no-cache'
        }
    }