import { expect as expectCDK, countResources, haveResourceLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import VirtualWall = require('../lib/virtual-wall-cicd-stack');

const app = new cdk.App();
const stack = new VirtualWall.VirtualWallCICDStack(app, 'MyTestStack');
test('Has two S3 Bucket for CICD', () => {
    expectCDK(stack).to(countResources('AWS::S3::Bucket', 2));
});

test('Has 3 CodeBuild Project (Site, Lambda and CDK)', () => {
    expectCDK(stack).to(countResources('AWS::CodeBuild::Project', 3));

    expectCDK(stack).to(haveResourceLike('AWS::CodeBuild::Project', {
        "Environment": {
            "ComputeType": "BUILD_GENERAL1_SMALL",
            "Image": "aws/codebuild/standard:2.0",
            "PrivilegedMode": false,
            "Type": "LINUX_CONTAINER"
        },
        "Source": {
            "BuildSpec": "buildspec-cdk.yml"
        },
    }));

    expectCDK(stack).to(haveResourceLike('AWS::CodeBuild::Project', {
        "Environment": {
            "ComputeType": "BUILD_GENERAL1_SMALL",
            "Image": "aws/codebuild/standard:2.0",
            "PrivilegedMode": false,
            "Type": "LINUX_CONTAINER"
        },
        "Source": {
            "BuildSpec": "buildspec.yml"
        },
    }));

    expectCDK(stack).to(haveResourceLike('AWS::CodeBuild::Project', {
        "Environment": {
            "ComputeType": "BUILD_GENERAL1_SMALL",
            "Image": "aws/codebuild/standard:2.0",
            "PrivilegedMode": false,
            "Type": "LINUX_CONTAINER"
        },
        "Source": {
            "BuildSpec": "buildspec-lambda.yml"
        },
    }));
});
