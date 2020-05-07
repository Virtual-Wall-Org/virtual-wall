#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { VirtualWallStack, EnvironmentType } from '../lib/virtual-wall-stack';
import { VirtualWallCICDStack } from '../lib/virtual-wall-cicd-stack';

const app = new cdk.App();
const mainStack = new VirtualWallStack(app, 'VirtualWallStack', { environmentType: EnvironmentType.Test });
new VirtualWallCICDStack(app, 'VirtualWallCICDStack', {
    lambdaCode : mainStack.lambdaCode
});

new VirtualWallStack(app, "LocalVirtualWallStack", { environmentType : EnvironmentType.Local});
