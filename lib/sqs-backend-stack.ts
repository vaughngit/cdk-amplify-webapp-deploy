import { Construct } from 'constructs';
import { Stack, StackProps, Duration, RemovalPolicy, Tags, App, CfnOutput } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {ManagedPolicy, Role, ServicePrincipal} from 'aws-cdk-lib/aws-iam';
import {SqsEventSource} from 'aws-cdk-lib/aws-lambda-event-sources';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import {Queue} from 'aws-cdk-lib/aws-sqs';
import * as path from 'path';

export interface IStackProps extends StackProps{
    environment: string; 
    solutionName: string; 
    serviceName: string; 
    costcenter: string; 
  }

export class SQSStack extends Stack {

  //private  targetQueue: Queue 
  //private  dlq: Queue
  //private  dlqFunction: NodejsFunction
  //private  dlqLambdaRole: Role 


  constructor(scope: App, id: string, props: IStackProps) {
    super(scope, id, props);
 
    // 👇 create sns topic as entry point from api gateway
    const snsTopic = new sns.Topic(this, 'sns-topic',{
        displayName: `${props.solutionName}-${props.serviceName}-${props.environment}-sns-topic`,
        topicName: `${props.solutionName}-${props.serviceName}-${props.environment}-sns-topic`,
    });
 

    //  dead letter sqs queue
    const dlq = new Queue(this, 'dead-letter-queue', {
        retentionPeriod: Duration.minutes(30),
        queueName: `${props.solutionName}-${props.serviceName}-${props.environment}-dlq`,
        removalPolicy: RemovalPolicy.DESTROY
    });


    // 👇 target topic queue
    const targetQueue = new Queue(this, 'sns topic sqs-queue', {
        queueName: `${props.solutionName}-${props.serviceName}-${props.environment}-sns-que`,
        removalPolicy: RemovalPolicy.DESTROY,
        deadLetterQueue: {
            queue: dlq,
            maxReceiveCount: 1,
        },
    });

    // 👇 subscribe queue to sns topic
    snsTopic.addSubscription(new subs.SqsSubscription(targetQueue));

   const dlqLambdaRole = new Role(this, `DQL-LambdaRole`, {
        roleName: `${props.solutionName}-${props.serviceName}-${props.environment}-dlq-function-iam-role-${this.region}`,
        description: `${props.solutionName}-${props.serviceName}-${props.environment}-dlq-function-iam-role`,
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
        ]
      });

          //  DLQ lambda function
   // const dlqFunction = new NodejsFunction(this, 'dlq-lambda', {
    const dlqFunction = new NodejsFunction(this, 'dlq-lambda', {
        functionName: `${props.solutionName}-${props.serviceName}-${props.environment}-dlq-function`,
        description: `${props.solutionName} ${props.serviceName} ${props.environment} dlq function`,
        role: dlqLambdaRole,
        memorySize: 1024,
        timeout: Duration.seconds(5),
        runtime: Runtime.NODEJS_14_X,
        handler: 'main',
        entry: path.join(__dirname, `/../assets/functions/dlq-lambda/index.ts`),
        events: [  new SqsEventSource(dlq)   ] //subscribe to target sqs queue 
    });

        // add dead letter queue as event source for dlq lambda function
        //dlqFunction.addEventSource(new SqsEventSource(dlq));

/* 

    // 👇 create lambda function
    const notificationLambda = new NodejsFunction(this, 'notification-lambda', {
        functionName: `${props.solutionName}-${props.serviceName}-${props.environment}-sns-function`,
        description: `${props.solutionName} ${props.serviceName} ${props.environment} sns function`,
        role: new Role(this, `SNS-LambdaRole`, {
            roleName: `${props.solutionName}-${props.serviceName}-${props.environment}-sns-function-iam-role-${this.region}`,
            description: `${props.solutionName}-${props.serviceName}-${props.environment}-sns-function-iam-role`,
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
              ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
          }),
        memorySize: 1024,
        timeout: Duration.seconds(5),
        runtime: Runtime.NODEJS_14_X,
        handler: 'main',
        entry: path.join(__dirname, `/../assets/functions/notification-lambda/index.ts`),
        events: [  new SqsEventSource(this.targetQueue, { batchSize: 10 })    ] //subscribe to target sqs queue 
    });

    //subscribe to target sqs queue 
   // notificationLambda.addEventSource(new SqsEventSource(this.targetQueue, { batchSize: 10 }) );

 */


    new CfnOutput(this, 'snsTopicArn', {
        exportName: `${props.solutionName}-${props.environment}-${this.region}-sns-topic-arn`,
        value: snsTopic.topicArn,
        description: 'The arn of the SNS topic',
    });
 

    Tags.of(this).add("service", `${props.serviceName}`,{
      includeResourceTypes: []
    })
    Tags.of(this).add("environment", props.environment)
    Tags.of(this).add("solution", props.solutionName)
    Tags.of(this).add("costcenter", props.costcenter)

  }
}