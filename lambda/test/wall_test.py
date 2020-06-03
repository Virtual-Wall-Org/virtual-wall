import os
import unittest
from unittest.mock import MagicMock
from wall import get_wall_count, create_wall

class TestWall(unittest.TestCase):

    def __create_context(self, db):
        context = MagicMock()
        context.database = db
        return context

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

if __name__ == '__main__':
    unittest.main()