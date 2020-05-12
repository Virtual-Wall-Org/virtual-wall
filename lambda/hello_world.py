import json

def helloWorld(event, context): 
    return {
        'statusCode': 200,
        'body': json.dumps("Connected")
    }