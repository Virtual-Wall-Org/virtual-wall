import * as cdk from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";
import * as lambda from '@aws-cdk/aws-lambda';
import { CfnOutput, Tag } from '@aws-cdk/core';
import { CloudFrontWebDistribution, CloudFrontAllowedMethods } from '@aws-cdk/aws-cloudfront';
import * as apigateway from "@aws-cdk/aws-apigateway";

export class VirtualWallStack extends cdk.Stack {
  public readonly lambdaCode: lambda.CfnParametersCode;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.lambdaCode = lambda.Code.fromCfnParameters();

    const handler = new lambda.Function(this, 'HelloWorldFunction', {
      code: this.lambdaCode,
      handler: 'hello_world.helloWorld',
      runtime: lambda.Runtime.NODEJS_10_X,
    });

    const api = new apigateway.RestApi(this, "HelloWorldApi", {
      restApiName: "Hello World Service",
      description: "This service returns hello world."
    });

    const HelloWorldIntegration = new apigateway.LambdaIntegration(handler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    api.root.addMethod("GET", HelloWorldIntegration);

    this.declareSite(api);
    new CfnOutput(this, "apiUrl", {
      value: api.url
    });

  }

  private declareSite(api: apigateway.RestApi) {
    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
    });
    new CfnOutput(this, "bucketName", {
      value: siteBucket.bucketName
    });
    const distribution = new CloudFrontWebDistribution(this, 'Distribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket
          },
          behaviors: [{ isDefaultBehavior: true }]
        },
        {
          customOriginSource: {
            domainName: `${api.restApiId}.execute-api.${this.region}.${this.urlSuffix}`
          },
          originPath: `/${api.deploymentStage.stageName}`,
          behaviors: [{
            pathPattern: '/api/*',
            allowedMethods: CloudFrontAllowedMethods.ALL
          }]
        }
      ]
    });
    
    new CfnOutput(this, "domainName", {
      value: distribution.domainName
    });
  }
}
