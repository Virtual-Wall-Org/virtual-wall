import * as cdk from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";
import { CfnOutput } from '@aws-cdk/core';

export class VirtualWallStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, "SiteBucket");

    new CfnOutput(this, "bucketName", {
      value: siteBucket.bucketName
    })
  }
}
