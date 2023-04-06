import { Stack, StackProps, SecretValue, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
//import {App} from 'aws-cdk-lib/aws-amplify';
import {App, GitHubSourceCodeProvider, BasicAuth} from '@aws-cdk/aws-amplify-alpha'
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export interface IStackProps extends StackProps{
  environment: string; 
  costcenter: string; 
  solutionName: string; 
}


export class AwsCdkAmplifyConsoleStack extends Stack {
  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id, props);

    const amplifyAppServiceRole =  new Role(this, 'AmplifyAppRole', {
      roleName: `${props?.solutionName}-amplifyApp-${props?.environment}-${this.region}`,
      assumedBy: new ServicePrincipal('amplify.amazonaws.com'),
      description: 'Amplify App Service Role',
      //inlinePolicies: {codeBuildProjectRoleInlinePolicy},
      managedPolicies: 
      [
        ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-Amplify'),
        ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')
      ]
    })
  

    const amplifyApp = new App(this, 'AmplifyConsoleDemo', {

      appName: "HelloWorldApp",
      description: "Example App to Development with Amplify",
      role: amplifyAppServiceRole, 
      sourceCodeProvider: new GitHubSourceCodeProvider({
        owner: 'vaughngit',
        repository: 'amplify-car-rental-app',
        oauthToken: SecretValue.secretsManager('dev/amplify/github-access-token'),
      }),
      autoBranchCreation: {
        patterns: ['*'],
      //  patterns: ['feature/*', 'test/*'],
        basicAuth: BasicAuth.fromGeneratedPassword('clouditadmin'),
      },
      autoBranchDeletion: true,
      buildSpec: codebuild.BuildSpec.fromObject(
        {
          version: 1,
          backend: {
            phases: {
              preBuild:{
                commands: [
                // "amplifyPush --simple"
                ]
              },
            //   build: {
            //     commands: [
            //       "amplifyPush --simple"
            //     ]
            //   }
            }
          },
          frontend: {
            phases: {
              preBuild: {
                commands: [
                  //"npm ci",
                  "amplifyPush --simple",
                  "npm ci",
                ]
              },
              build: {
                commands: [
                 // "npm run build:$BUILD_ENV"
                // "echo storage tables:",
                // "echo $AMPLIFY_STORAGE_TABLES",
                 //"amplifyPush --simple",
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

    

    const main = amplifyApp.addBranch('main', {
      basicAuth: BasicAuth.fromGeneratedPassword('clouditadmin'),
    });
    const dev = amplifyApp.addBranch('dev', {
      basicAuth: BasicAuth.fromGeneratedPassword('clouditadmin'),
    });

    const domain = amplifyApp.addDomain('thehandle.com');
    domain.mapRoot(main);
    domain.mapSubDomain(main, 'www');
    domain.mapSubDomain(dev);

    Tags.of(this).add("environment", props.environment)
    Tags.of(this).add("solution", props.solutionName)
    Tags.of(this).add("costcenter", props.costcenter)
  }
}
