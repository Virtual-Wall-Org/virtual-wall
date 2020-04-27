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

    const distribution = new CloudFrontWebDistribution(this, 'Distribution', {
    originConfigs: [
        {
            s3OriginSource: {
                s3BucketSource: siteBucket
            },
            behaviors : [ {isDefaultBehavior: true}]
        }
    ]
  });

  new CfnOutput(this, "domainName", {
    value: distribution.domainName
  })
  

  }
}
