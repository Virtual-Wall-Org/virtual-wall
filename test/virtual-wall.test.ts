import { expect as expectCDK, countResources } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import VirtualWall = require('../lib/virtual-wall-stack');

test('Has an S3 Bucket', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new VirtualWall.VirtualWallStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(countResources('AWS::S3::Bucket', 1));
});
