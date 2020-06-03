import json
import os

TABLE_NAME = os.environ.get('TABLE_NAME', 'undefined table')

def get_database(context):
	if context and hasattr(context, 'database'):
		return context.database
	import boto3
	return boto3.client('dynamodb')

def get_wall_count(event, context):
	dynamodb = get_database(context)
	element_count = dynamodb.describe_table(TableName=TABLE_NAME)['Table']['ItemCount']
	return {
		'statusCode': 200,
		'body': json.dumps(str(element_count) + ' elements in the table.'),
		'headers' : {
			'Cache-Control': 'no-cache'
		}
	}

def create_wall(event, context): 
	dynamodb = get_database(context)
	print(json.dumps(event))
	wall_name = event['pathParameters']['wall_id']
	result = dynamodb.put_item(TableName=TABLE_NAME, Item={
		'wall_id' : {'S' : wall_name}
	})
	return {
		'statusCode': 200,
		'body': json.dumps(result),
		'headers' : {
			'Cache-Control': 'no-cache'
		}
	}

