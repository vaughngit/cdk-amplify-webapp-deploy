import {CfnOutput,	Duration,	RemovalPolicy,	Stack,	StackProps} from 'aws-cdk-lib'
import {Color, SingleValueWidget, TextWidget, IWidget, } from 'aws-cdk-lib/aws-cloudwatch';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'


import { Construct } from 'constructs'

// import * as path from 'path'
// import { Schedule, Rule } from 'aws-cdk-lib/aws-events'
// import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets'
// import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda'


export interface IStackProps extends StackProps {
	/** Table Partition Key */
	partitionKey: string;
	/** Optional Sort Key */
	sortKey?: string;
	/** Table Name */
	tableName: string;
	/** Retain the table on stack deletion */
	retainTable?: boolean;
	/**
	   * Enable TTL Field (ExpiryTime)
	   * @default false
	   */
	enableTtl?: boolean;
  };
  

export class DynamodbStack extends Stack {

	table: Table;
	/** Dashboard Widgets */
	dashboardWidgets: IWidget[];
	
	constructor(scope: Construct, id: string, props: IStackProps) {
		super(scope, id, props);
		const {
			partitionKey,
			sortKey,
			tableName,
			retainTable,
			enableTtl = true,
		  } = props;

		  
		// create the dynamodb table
		const dataTable = new Table(this, 'DataTable', {
			billingMode: BillingMode.PAY_PER_REQUEST,
			partitionKey: { name: partitionKey, type: AttributeType.STRING },
			//sortKey: (sortKey) ? { name: sortKey, type: AttributeType.STRING } : undefined,
			removalPolicy: (retainTable) ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
			//timeToLiveAttribute: (enableTtl) ? 'ExpiryTime' : undefined,
		})

		
		// give the lambda permission to write to DynamoDB
		//userTable.grantWriteData(addUserLambda)

		// //Create a schedule so that the Lambda gets triggered every 5 minutes
		// new Rule(this, 'addUserRule', {
		// 	schedule: Schedule.rate(Duration.minutes(5)),
		// 	targets: [new LambdaFunction(addUserLambda)],
		// })

		  // Metrics ===========================================
		  const writeMetric = dataTable.metricConsumedWriteCapacityUnits({
			label: 'Write Capacity Units',
			dimensionsMap: {
			  TableName: tableName,
			},
			statistic: 'sum',
			period: Duration.minutes(15),
			color: Color.BROWN,
		  });
		  const readMetric = dataTable.metricConsumedReadCapacityUnits({
			label: 'Read Capacity Units',
			dimensionsMap: {
			  TableName: tableName,
			},
			statistic: 'sum',
			period: Duration.minutes(15),
			color: Color.PURPLE,
		  });
	  
		  // Dashboard Widgets
		  const headerWidget = new TextWidget({
			markdown: `## ${tableName} Metrics`,
			width: 24,
			height: 1,
		  });
		  const readCapacity = new SingleValueWidget({
			title: `${tableName} Read Capacity`,
			metrics: [readMetric],
			sparkline: true,
			height: 4,
			width: 6,
		  });
		  const writeCapacity = new SingleValueWidget({
			title: `${tableName} Write Capacity`,
			metrics: [writeMetric],
			sparkline: true,
			height: 4,
			width: 6,
		  });
		  this.dashboardWidgets = [
			headerWidget,
			readCapacity,
			writeCapacity,
		  ];

/* 
		// output these variables. The frontend needs some of these. See deploy script in package.json
		new CfnOutput(this, 'GraphQLURL', {
			value: api.graphqlUrl,
		})

		// AppsyncStack.ts
		new CfnOutput(this, 'GraphqlApiKey', {
			value: api.apiKey ?? 'UNDEFINED',
			//exportName: 'api-key',
		});
 */

	}
}
