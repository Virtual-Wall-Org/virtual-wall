import * as cdk from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";
import { CfnOutput, Tag } from '@aws-cdk/core';
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront';

export interface VirtualWallStackProps extends cdk.StackProps {
  readonly envName: string;
}

export class VirtualWallStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: VirtualWallStackProps) {
    super(scope, id, props);

    Tag.add(this, "environment", props?.envName || "unknown");

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
          behaviors: [{ isDefaultBehavior: true }]
        }
      ]
    });

    new CfnOutput(this, "domainName", {
      value: distribution.domainName
    });


  }
}
