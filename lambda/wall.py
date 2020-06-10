import json
import os

TABLE_NAME = os.environ.get('TABLE_NAME', 'undefined table')

def get_table(context):
	if context and hasattr(context, 'table'):
		return context.table
	import boto3
	return boto3.resource('dynamodb').Table(TABLE_NAME)

def get_route(event):
	return {
		'health_check' : health_check,
		'get_wall_count' : get_wall_count,
		'create_wall' : create_wall,
		'get_wall_content' : get_wall_content,
		'put_wall_content' : put_wall_content,
	}.get(__get_operation_name(event))


def routing(event, context, get_route_function=None):
	route = (get_route_function or get_route)(event)
	if route:
		return route(event, context)

	return {
		'statusCode': 404,
		'body': 'Unknown operation %s.' % (__get_operation_name(event)),
		'headers' : {
			'Cache-Control': 'no-cache'
		}
	}

def health_check(event, context):
	return {
		'statusCode': 200,
		'body': json.dumps('Alive'),
		'headers' : {
			'Cache-Control': 'no-cache'
		}
	}

def get_wall_count(event, context):
	table = get_table(context)
	return {
		'statusCode': 200,
		'body': json.dumps(str(table.item_count) + ' elements in the table.'),
		'headers' : {
			'Cache-Control': 'no-cache'
		}
	}

def create_wall(event, context): 
	table = get_table(context)
	wall_id = __get_wall_id(event)
	result = table.put_item(
		Item={
			'wall_id' : wall_id
		}
	)
	return {
		'statusCode': 200,
		'body': json.dumps(result),
		'headers' : {
			'Cache-Control': 'no-cache'
		}
	}

def get_wall_content(event, context): 
	table = get_table(context)
	wall_id = __get_wall_id(event)
	result = table.get_item(
		Key={
			'wall_id': wall_id
		},
		AttributesToGet=[
			'content',
		]
	)
	return {
		'statusCode': 200,
		'body': json.dumps(result),
		'headers' : {
			'Cache-Control': 'no-cache'
		}
	}

def put_wall_content(event, context): 
	table =  get_table(context)

	wall_id = __get_wall_id(event)
	content = json.loads(event['body'])
	
	result = table.update_item(
		Key={
			'wall_id': wall_id
		},
		AttributeUpdates={
			'content': {
				'Value': content
			}
		}
	)
	
	return {
		'statusCode': 200,
		'body': json.dumps(result),
		'headers' : {
			'Cache-Control': 'no-cache'
		}
	}

def __get_operation_name(event):
	return event.get('requestContext', {}).get('operationName', None)

def __get_wall_id(event):
	return event.get('pathParameters', {}).get('wall_id', None)