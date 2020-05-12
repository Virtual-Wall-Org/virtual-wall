import * as cdk from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as lambda from '@aws-cdk/aws-lambda';
import { CfnOutput, Tag } from '@aws-cdk/core';
import { CloudFrontWebDistribution, CloudFrontAllowedMethods } from '@aws-cdk/aws-cloudfront';
import * as apigateway from "@aws-cdk/aws-apigateway";
import { Code } from '@aws-cdk/aws-lambda';

export enum EnvironmentType {
  Local,
  Test
}

export interface VirtualWallStackProps extends cdk.StackProps {
  readonly environmentType: EnvironmentType;
}

export class VirtualWallStack extends cdk.Stack {
  public readonly lambdaCode: lambda.CfnParametersCode;

  constructor(scope: cdk.Construct, id: string, props: VirtualWallStackProps) {
    super(scope, id, props);

    var actualCode : Code;
    if(props?.environmentType == EnvironmentType.Local){
      actualCode = lambda.Code.asset("lambda");
    }else{
      actualCode = this.lambdaCode = lambda.Code.fromCfnParameters();
    }

    const api = this.declareApi(actualCode);
    this.declareSite(api, props.environmentType);

    new CfnOutput(this, "apiUrl", {
      value: api.url
    });

  }

  private declareApi(actualCode: lambda.Code) {
    const handler = new lambda.Function(this, 'HelloWorldFunction', {
      code: actualCode,
      handler: 'hello_world.helloWorld',
      runtime: lambda.Runtime.PYTHON_3_8,
    });
    const api = new apigateway.RestApi(this, "HelloWorldApi", {
      restApiName: "Hello World Service",
      description: "This service returns hello world."
    });
    const HelloWorldIntegration = new apigateway.LambdaIntegration(handler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });
    api.root.addResource("api").addMethod("GET", HelloWorldIntegration);
    return api;
  }

  private declareSite(api: apigateway.RestApi, environmentType: EnvironmentType) {
    const siteBucket = this.declareBucket(environmentType);
    this.declareCloudFront(siteBucket, api);
  }

  private declareCloudFront(siteBucket: s3.Bucket, api: apigateway.RestApi) {
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

  private declareBucket(environmentType: EnvironmentType) {
    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
    });
    if (environmentType == EnvironmentType.Local) {
      new s3deploy.BucketDeployment(this, 'DeployWebsite', {
        sources: [s3deploy.Source.asset('./static')],
        destinationBucket: siteBucket
      });
    }
    new CfnOutput(this, "bucketName", {
      value: siteBucket.bucketName
    });
    return siteBucket;
  }
}
