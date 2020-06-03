import * as cdk from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as lambda from '@aws-cdk/aws-lambda';
import { CloudFrontWebDistribution, CloudFrontAllowedMethods, IDistribution } from '@aws-cdk/aws-cloudfront';
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { CfnParameter, Duration } from '@aws-cdk/core';

export enum EnvironmentType {
	Local,
	Test
}

export interface VirtualWallStackProps extends cdk.StackProps {
	readonly environmentType: EnvironmentType;
}

const PRIMARY_KEY = 'wall_id';

export class VirtualWallStack extends cdk.Stack {
	public readonly lambdaCode: lambda.CfnParametersCode;
	public readonly environmentName: CfnParameter;

	constructor(scope: cdk.Construct, id: string, props: VirtualWallStackProps) {
		super(scope, id, props);

		this.environmentName = new CfnParameter(this, "environmentName", {
			type: "String",
			description: "The name of this environment.",
			default: this.stackName
		}
		);

		var actualCode: lambda.Code;
		if (props?.environmentType == EnvironmentType.Local) {
			actualCode = lambda.Code.asset("lambda");
		} else {
			actualCode = this.lambdaCode = lambda.Code.fromCfnParameters();
		}

		const api = this.declareApi(actualCode);
		this.declareSite(api, props.environmentType);

		new cdk.CfnOutput(this, "apiUrl", {
			value: api.url
		});

	}

	private declareApi(actualCode: lambda.Code) {
		const dynamoTable = new dynamodb.Table(this, 'wallDB', {
			partitionKey: {
				name: PRIMARY_KEY,
				type: dynamodb.AttributeType.STRING
			}
		});

		const api = new apigateway.RestApi(this, "WallApi", {
			restApiName: this.environmentName.valueAsString + " - Wall Service",
			description: "This service handle wall related operations."
		});
		const apiResource = api.root.addResource("api");

		const HealthCheckLambdaIntegration = this.createIntegration('HealthCheckFunction', 'wall.health_check', actualCode, dynamoTable);
		apiResource.addMethod("GET", HealthCheckLambdaIntegration);

		const wallResource = apiResource.addResource("wall");
		const specificWallResource = wallResource.addResource("{wall_id}");

		const WallCountLambdaIntegration = this.createIntegration('WallCountFunction', 'wall.get_wall_count', actualCode, dynamoTable);
		specificWallResource.addMethod("GET", WallCountLambdaIntegration);

		const CreateWallLambdaIntegration = this.createIntegration('CreateWallFunction', 'wall.create_wall', actualCode, dynamoTable);
		specificWallResource.addMethod("POST", CreateWallLambdaIntegration);

		return api;
	}

	private createIntegration(functionName: string, functionPath: string, actualCode: lambda.Code, dynamoTable: dynamodb.Table) {
		const wallCountHandler = new lambda.Function(this, functionName, {
			code: actualCode,
			handler: functionPath,
			runtime: lambda.Runtime.PYTHON_3_8,
			timeout: Duration.seconds(20),
			environment: {
				TABLE_NAME: dynamoTable.tableName,
				PRIMARY_KEY: PRIMARY_KEY
			}
		});
		dynamoTable.grantReadWriteData(wallCountHandler);
		dynamoTable.grantFullAccess(wallCountHandler);
		const WallCountLambdaIntegration = new apigateway.LambdaIntegration(wallCountHandler, {
			requestTemplates: { "application/json": '{ "statusCode": "200" }' }
		});
		return WallCountLambdaIntegration;
	}

	private declareSite(api: apigateway.RestApi, environmentType: EnvironmentType) {
		const siteBucket = this.declareBucket(environmentType);
		const distribution = this.declareCloudFront(siteBucket, api);
		this.deployBucket(siteBucket, distribution, environmentType);
	}

	private deployBucket(siteBucket: s3.Bucket, distribution: IDistribution, environmentType: EnvironmentType) {
		if (environmentType == EnvironmentType.Local) {
			new s3deploy.BucketDeployment(this, 'DeployWebsite', {
				sources: [s3deploy.Source.asset('./static')],
				destinationBucket: siteBucket,
				distribution
			});
		}
	}

	private declareCloudFront(siteBucket: s3.Bucket, api: apigateway.RestApi) {
		const distribution = new CloudFrontWebDistribution(this, 'Distribution', {
			originConfigs: [
				{
					s3OriginSource: {
						s3BucketSource: siteBucket
					},
					behaviors: [{ isDefaultBehavior: true }]
				},
				{
					customOriginSource: {
						domainName: `${api.restApiId}.execute-api.${this.region}.${this.urlSuffix}`
					},
					originPath: `/${api.deploymentStage.stageName}`,
					behaviors: [{
						pathPattern: '/api/*',
						allowedMethods: CloudFrontAllowedMethods.ALL
					}]
				}
			],
			comment: this.environmentName.valueAsString
		});
		new cdk.CfnOutput(this, "domainName", {
			value: distribution.domainName
		});
		return distribution;
	}

	private declareBucket(environmentType: EnvironmentType) {
		const siteBucket = new s3.Bucket(this, "SiteBucket", {
			websiteIndexDocument: 'index.html',
			websiteErrorDocument: 'error.html',
			publicReadAccess: true,
		});
		new cdk.CfnOutput(this, "bucketName", {
			value: siteBucket.bucketName
		});
		return siteBucket;
	}
}
