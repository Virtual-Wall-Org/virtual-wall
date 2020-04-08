#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { VirtualWallStack } from '../lib/virtual-wall-stack';

const app = new cdk.App();
new VirtualWallStack(app, 'VirtualWallStack');
