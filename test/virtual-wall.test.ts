import { expect as expectCDK, countResources, haveOutput } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import VirtualWall = require('../lib/virtual-wall-stack');

const app = new cdk.App();
const stack = new VirtualWall.VirtualWallStack(app, 'MyTestStack');

test('Has an S3 Bucket', () => {
    // THEN
    expectCDK(stack).to(countResources('AWS::S3::Bucket', 1));
    expectCDK(stack).to(haveOutput({outputName: 'bucketName'}));
});

test('Has an CloudFront', () => {
    expectCDK(stack).to(countResources('AWS::CloudFront::Distribution', 1));
    expectCDK(stack).to(haveOutput({outputName: 'domainName'}));
});
