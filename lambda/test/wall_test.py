import os
import unittest
from unittest.mock import MagicMock
from wall import get_route, routing, get_wall_count, create_wall, health_check

class TestWall(unittest.TestCase):

	def __create_context(self, db):
		context = MagicMock()
		context.database = db
		return context

	def test_get_route(self):
		event = {"requestContext":{"operationName":"health_check"}}
		route = get_route(event)
		self.assertEqual(route, health_check)

	def test_get_route_no_context(self):
		event = {}
		route = get_route(event)
		self.assertEqual(route, None)

	def test_routing(self):
		event = {"requestContext":{"operationName":"fake_operation"}}
		context = "This is a fake context"
		mock_fake_operation = MagicMock(return_value="fake_result")
		mock_get_route = MagicMock(return_value=mock_fake_operation)
		
		result = routing(event, context, get_route_function=mock_get_route)

		self.assertEqual(result, "fake_result")
		mock_get_route.assert_called_with(event)
		mock_fake_operation.assert_called_with(event, context)

	def test_routing_unknown_route(self):
		event = {"requestContext":{"operationName":"unknown_operation"}}
		context = "This is a fake context"
		mock_get_route = MagicMock(return_value=None)
		
		result = routing(event, context, get_route_function=mock_get_route)

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
		route = get_route(event)
		self.assertEqual(route, None)

	def test_get_wall_count(self):
		db = MagicMock()
		db.describe_table = MagicMock(return_value={'Table': {'ItemCount':42}})
		result = get_wall_count(None, self.__create_context(db))
		self.assertEqual(result, {
			'body': '"42 elements in the table."',
			'headers': {'Cache-Control': 'no-cache'},
			'statusCode': 200
		})
		db.describe_table.assert_called_with(TableName='undefined table')

	def test_create_wall(self):
		db = MagicMock()
		db.put_item = MagicMock(return_value='This is the returned item')
		result = create_wall({
			'pathParameters':{'wall_id':'my unit test wall name'},
			'httpMethod': 'POST',
			'body': '{}'
		}, self.__create_context(db))
		self.assertEqual(result, {
			'body': '"This is the returned item"',
			'headers': {'Cache-Control': 'no-cache'},
			'statusCode': 200
		})
		db.put_item.assert_called_with(TableName='undefined table', Item={'wall_id': {'S': 'my unit test wall name'}})

	def test_health_check(self):
		result = health_check(None, None)
		self.assertEqual(result, {
			'body': '"Alive"',
			'headers': {'Cache-Control': 'no-cache'},
			'statusCode': 200
		})

if __name__ == '__main__':
	unittest.main()