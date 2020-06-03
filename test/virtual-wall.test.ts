import { expect as expectCDK, countResources, haveOutput, haveResourceLike, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import VirtualWall = require('../lib/virtual-wall-stack');

const app = new cdk.App();
const stack = new VirtualWall.VirtualWallStack(app, 'MyTestStack', { environmentType : VirtualWall.EnvironmentType.Test });

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
			"Comment": {
				"Ref": "environmentName"
			},
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

test('Has a get_wall_count Lambda Function', () => {
	checkLambda("wall.get_wall_count");
});

test('Has a create_wall Lambda Function', () => {
	checkLambda("wall.create_wall")
});

test('Has a health_check Lambda Function', () => {
	checkLambda("wall.health_check")
});

function checkLambda(handler:string){
	expectCDK(stack).to(haveResourceLike('AWS::Lambda::Function', {
		"Handler": handler,
		"Environment" : {
			"Variables": {
				"ENVIRONMENT_NAME" : {
					"Ref": "environmentName"
				}
			}
		},
		"Runtime": "python3.8",
		"Timeout": 20
	}));
}

test('Has a Dynamo DB', () => {
	expectCDK(stack).to(haveResourceLike('AWS::DynamoDB::Table', {
		"KeySchema": [{
			"AttributeName": "wall_id",
			"KeyType": "HASH"
		}]
	}));
});

test('Has an API ', () => {
	expectCDK(stack).to(haveResourceLike('AWS::ApiGateway::RestApi', {
		"Description": "This service handle wall related operations.",
		"Name": {
			"Fn::Join": [
			  "",
			  [
				{
				  "Ref": "environmentName"
				},
				" - Wall Service"
			  ]
			]
		  }
	}));

	expectCDK(stack).to(haveResourceLike('AWS::ApiGateway::Resource', {
		"PathPart": "api",
	}));
	
	expectCDK(stack).to(haveResourceLike('AWS::ApiGateway::Resource', {
		"PathPart": "wall",
	}));

	expectCDK(stack).to(haveResourceLike('AWS::ApiGateway::Resource', {
		"PathPart": "{wall_id}"
	}));

	expectCDK(stack).to(haveResourceLike('AWS::ApiGateway::Method', {
		"HttpMethod": "GET"
	}));
	
	expectCDK(stack).to(haveResourceLike('AWS::ApiGateway::Method', {
		"HttpMethod": "POST"
	}));
	expectCDK(stack).to(haveOutput({ outputName: 'apiUrl' }));
});

