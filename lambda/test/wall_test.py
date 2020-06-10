import os
import unittest
from unittest.mock import MagicMock
import wall
import decimal 

class TestWall(unittest.TestCase):

	def __create_table_context(self, table):
		context = MagicMock()
		context.table = table
		return context

	def test_get_route(self):
		event = {"requestContext":{"operationName":"health_check"}}
		route = wall.get_route(event)
		self.assertEqual(route, wall.health_check)

	def test_get_route_no_context(self):
		event = {}
		route = wall.get_route(event)
		self.assertEqual(route, None)

	def test_routing(self):
		event = {"requestContext":{"operationName":"fake_operation"}}
		context = "This is a fake context"
		mock_fake_operation = MagicMock(return_value="fake_result")
		mock_get_route = MagicMock(return_value=mock_fake_operation)
		
		result = wall.routing(event, context, get_route_function=mock_get_route)

		self.assertEqual(result, "fake_result")
		mock_get_route.assert_called_with(event)
		mock_fake_operation.assert_called_with(event, context)

	def test_routing_unknown_route(self):
		event = {"requestContext":{"operationName":"unknown_operation"}}
		context = "This is a fake context"
		mock_get_route = MagicMock(return_value=None)
		
		result = wall.routing(event, context, get_route_function=mock_get_route)

		self.assertEqual(result, {
			'statusCode': 404,
			'body': 'Unknown operation unknown_operation.',
			'headers' : {
				'Cache-Control': 'no-cache'
			}
		})
		mock_get_route.assert_called_with(event)

	def test_get_route_no_operation(self):
		event = {"requestContext":{}}
		route = wall.get_route(event)
		self.assertEqual(route, None)

	def test_get_wall_count(self):
		mock_table = MagicMock()
		mock_table.item_count = 42
		result = wall.get_wall_count(None, self.__create_table_context(mock_table))
		self.assertEqual(result, {
			'body': '"42 elements in the table."',
			'headers': {'Cache-Control': 'no-cache'},
			'statusCode': 200
		})

	def test_create_wall(self):
		mock_table = MagicMock()
		mock_table.put_item = MagicMock(return_value='This is the returned item')
		result = wall.create_wall({
			'pathParameters':{'wall_id':'my unit test wall name'},
			'httpMethod': 'POST',
			'body': '{}'
		}, self.__create_table_context(mock_table))

		self.assertEqual(result, {
			'body': '"This is the returned item"',
			'headers': {'Cache-Control': 'no-cache'},
			'statusCode': 200
		})
		mock_table.put_item.assert_called_with(Item={'wall_id': 'my unit test wall name'})

	def test_get_wall_content(self):
		mock_table = MagicMock()
		mock_table.get_item = MagicMock(return_value={})
		result = wall.get_wall_content({
			'pathParameters':{'wall_id':'my unit test wall name'},
			'httpMethod': 'GET',
			'body': '{}'
		}, self.__create_table_context(mock_table))
		self.assertEqual(result, {
			'body': '{}',
			'headers': {'Cache-Control': 'no-cache'},
			'statusCode': 200
		})
		mock_table.get_item.assert_called_with(
			Key={'wall_id': 'my unit test wall name'}, 
			AttributesToGet=[ 'content', ]
		)
	
	def test_get_wall_content_with_decimal(self):
		mock_table = MagicMock()
		mock_table.get_item = MagicMock(return_value={"Item": {
			"content": {
				"strokes": [
					decimal.Decimal("1.2")
				]
			}
		}})
		result = wall.get_wall_content({
			'pathParameters':{'wall_id':'my unit test wall name'},
			'httpMethod': 'GET',
			'body': '{}'
		}, self.__create_table_context(mock_table))
		self.assertEqual(result, {
			'body': '{"strokes": ["1.2"]}',
			'headers': {'Cache-Control': 'no-cache'},
			'statusCode': 200
		})
		mock_table.get_item.assert_called_with(
			Key={'wall_id': 'my unit test wall name'}, 
			AttributesToGet=[ 'content', ]
		)

	def test_put_wall_content(self):
		mock_table = MagicMock()
		mock_table.update_item = MagicMock(return_value='This is the returned item')
		result = wall.put_wall_content({
			'pathParameters':{'wall_id':'my unit test wall name'},
			'httpMethod': 'GET',
			'body': '{"strokes":[1,2,3],"texts":[]}'
		}, self.__create_table_context(mock_table))
		self.assertEqual(result, {
			'body': '"This is the returned item"',
			'headers': {'Cache-Control': 'no-cache'},
			'statusCode': 200
		})
		mock_table.update_item.assert_called_with(
			Key={'wall_id': 'my unit test wall name'}, 
			AttributeUpdates={
				'content': {
					'Value': {"strokes":[1,2,3],"texts":[]}
				}
			}
		)

	def test_health_check(self):
		result = wall.health_check(None, None)
		self.assertEqual(result, {
			'body': '"Alive"',
			'headers': {'Cache-Control': 'no-cache'},
			'statusCode': 200
		})

if __name__ == '__main__':
	unittest.main()