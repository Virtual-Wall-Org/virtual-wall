import { expect as expectCDK, countResources, haveResourceLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { VirtualWallCICDStack } from '../lib/virtual-wall-cicd-stack';
import { VirtualWallStack, EnvironmentType } from '../lib/virtual-wall-stack';

const app = new cdk.App();
const mainStack = new VirtualWallStack(app, 'VirtualWallStack', { environmentType : EnvironmentType.Test});
const stack = new VirtualWallCICDStack(app, 'MyTestStack', { 
    lambdaCode: mainStack.lambdaCode 
});

test('Has a S3 Bucket for deployment', () => {
    expectCDK(stack).to(countResources('AWS::S3::Bucket', 1));
});

test('Has 3 CodeBuild Project (Site, Lambda and CDK)', () => {
    expectCDK(stack).to(countResources('AWS::CodeBuild::Project', 3));

    expectCDK(stack).to(haveResourceLike('AWS::CodeBuild::Project', {
        "Environment": {
            "ComputeType": "BUILD_GENERAL1_SMALL",
            "Image": "aws/codebuild/standard:4.0",
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
            "Image": "aws/codebuild/standard:4.0",
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
            "Image": "aws/codebuild/standard:4.0",
            "PrivilegedMode": false,
            "Type": "LINUX_CONTAINER"
        },
        "Source": {
            "BuildSpec": "buildspec-lambda.yml"
        },
    }));
});
