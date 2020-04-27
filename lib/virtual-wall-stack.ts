import * as cdk from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";
import { CfnOutput } from '@aws-cdk/core';
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront';

export class VirtualWallStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
    });

    new CfnOutput(this, "bucketName", {
      value: siteBucket.bucketName
    })
    const sourceBucketProd = new s3.Bucket(this, 'production');
    const sourceBucketTest = new s3.Bucket(this, 'test');

    const distribution = new CloudFrontWebDistribution(this, 'MyDistribution', {
    originConfigs: [
        {
            s3OriginSource: {
                s3BucketSource: sourceBucketProd
            },
            behaviors : [ {isDefaultBehavior: true}]
        }
    ]
  });

  }
}
