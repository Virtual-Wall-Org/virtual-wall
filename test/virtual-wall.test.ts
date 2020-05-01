import { expect as expectCDK, countResources, haveOutput, haveResourceLike, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import VirtualWall = require('../lib/virtual-wall-stack');

const app = new cdk.App();
const stack = new VirtualWall.VirtualWallStack(app, 'MyTestStack');

test('Has an S3 Bucket', () => {
    expectCDK(stack).to(haveResourceLike('AWS::S3::Bucket', {
        WebsiteConfiguration: {
            ErrorDocument: "error.html",
            IndexDocument: "index.html"
        }
    }));
    expectCDK(stack).to(haveOutput({ outputName: 'bucketName' }));
});

test('Has an CloudFront', () => {
    expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
        "DistributionConfig": {
            "DefaultCacheBehavior": {
                "AllowedMethods": [
                    "GET",
                    "HEAD"
                ],
                "CachedMethods": [
                    "GET",
                    "HEAD"
                ],
                "Compress": true,
                "ForwardedValues": {
                    "Cookies": {
                        "Forward": "none"
                    },
                    "QueryString": false
                },
                "TargetOriginId": "origin1",
                "ViewerProtocolPolicy": "redirect-to-https"
            },
            "DefaultRootObject": "index.html",
            "Enabled": true,
            "HttpVersion": "http2",
            "IPV6Enabled": true,
            "PriceClass": "PriceClass_100",
            "ViewerCertificate": {
                "CloudFrontDefaultCertificate": true
            }
        }
    }));
    expectCDK(stack).to(haveOutput({ outputName: 'domainName' }));
});

test('Has a Lambda Function', () => {
    expectCDK(stack).to(haveResourceLike('AWS::Lambda::Function', {
        "Handler": "hello_world.helloWorld",
        "Runtime": "nodejs10.x"
    }));
});

test('Has an API ', () => {
    expectCDK(stack).to(haveResourceLike('AWS::ApiGateway::RestApi', {
        "Description": "This service returns hello world.",
        "Name": "Hello World Service"
    }));
    expectCDK(stack).to(haveResourceLike('AWS::ApiGateway::Method', {
        "HttpMethod": "GET"
    }));
    expectCDK(stack).to(haveOutput({ outputName: 'apiUrl' }));
});

