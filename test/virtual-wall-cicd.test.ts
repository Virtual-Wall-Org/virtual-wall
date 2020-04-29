import { expect as expectCDK, countResources, haveOutput } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import VirtualWall = require('../lib/virtual-wall-cicd-stack');

const app = new cdk.App();
const stack = new VirtualWall.VirtualWallCICDStack(app, 'MyTestStack');
test('Has two S3 Bucket for CICD', () => {
    // THEN
    expectCDK(stack).to(countResources('AWS::S3::Bucket', 2));
});

test('Has two CodeBuild Project (CICD and Application)', () => {
    // THEN
    expectCDK(stack).to(countResources('AWS::CodeBuild::Project', 2));
});
