#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { VirtualWallStack } from '../lib/virtual-wall-stack';
import { VirtualWallCICDStack } from '../lib/virtual-wall-cicd-stack';

const app = new cdk.App();
const mainStack = new VirtualWallStack(app, 'VirtualWallStack');
new VirtualWallCICDStack(app, 'VirtualWallCICDStack', {
    lambdaCode : mainStack.lambdaCode
});
