#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkAmplifyConsoleStack } from '../lib/cdk-amplify-console-stack';
import { GuestUserStack } from '../lib/guest-user-backend-stack'

const aws_region = 'us-east-2'
const environment = 'dev'
const solutionName = "tnc"
const costcenter = "tnc-helloworld-amplify"

const app = new cdk.App();
new AwsCdkAmplifyConsoleStack(app, 'AwsCdkAmplifyConsoleStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: aws_region || process.env.AWS_Region },
  environment, 
  solutionName, 
  costcenter,
});

// new GuestUserStack(app, 'AmplifyCognitoBackendStack', {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: "us-east-2",
//   },
// })
