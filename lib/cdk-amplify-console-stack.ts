import { Stack, StackProps, SecretValue } from 'aws-cdk-lib';
import { Construct } from 'constructs';
//import {App} from 'aws-cdk-lib/aws-amplify';
import {App, GitHubSourceCodeProvider, BasicAuth} from '@aws-cdk/aws-amplify-alpha'
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

export class AwsCdkAmplifyConsoleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const amplifyApp = new App(this, 'AmplifyConsoleDemo', {

      sourceCodeProvider: new GitHubSourceCodeProvider({
        owner: 'vaughngit',
        repository: 'amplify-car-rental-app',
        oauthToken: SecretValue.secretsManager('dev/amplify/github-access-token'),
      }),
      // autoBranchCreation: {
      //   patterns: ['*'],
      //   basicAuth: BasicAuth.fromGeneratedPassword('username'),
      // },
      autoBranchDeletion: true,
      buildSpec: codebuild.BuildSpec.fromObject(
        {
          version: 1,
          frontend: {
            phases: {
              preBuild: {
                commands: [
                  "npm ci"
                ]
              },
              build: {
                commands: [
                  "npm run build"
                ]
              }
            },
            artifacts: {
              baseDirectory: "build",
              files: [
                "**/*"
              ]
            },
            cache: {
              paths: [
                "node_modules/**/*"
              ]
            }
          }
        }        
      ),
    });

    const main = amplifyApp.addBranch('main');
    const dev = amplifyApp.addBranch('dev', {
      basicAuth: BasicAuth.fromGeneratedPassword('username'),
    });

    const domain = amplifyApp.addDomain('amplified.host');
    domain.mapRoot(main);
    domain.mapSubDomain(main, 'www');
    domain.mapSubDomain(dev);
  }
}
