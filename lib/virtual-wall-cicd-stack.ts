import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from "@aws-cdk/aws-s3";
import * as lambda from '@aws-cdk/aws-lambda';

const BUILD_IMAGE = codebuild.LinuxBuildImage.STANDARD_4_0;

export interface CICDStackProps extends cdk.StackProps {
	readonly lambdaCode: lambda.CfnParametersCode;
}


export class VirtualWallCICDStack extends cdk.Stack {
	constructor(scope: cdk.Construct, id: string, props: CICDStackProps) {
		super(scope, id, props);

		const sourceOutput = new codepipeline.Artifact("VirtualWall-Source");
		const cdkBuildOutput = new codepipeline.Artifact("VirtualWall-Build")
		const siteBuildOutput = new codepipeline.Artifact("VirtualWall-Site-Build")
		const lambdaBuildOutput = new codepipeline.Artifact("VirtualWall-Lambda-Build")

		const pipeline = new codepipeline.Pipeline(this, 'VirtualWall-Pipeline', {});
		pipeline.addStage({
			stageName: 'Source',
			actions: [
				this.githubSource(sourceOutput)
			],
		});

		pipeline.addStage({
			stageName: 'Build',
			actions: [
				this.buildSite(sourceOutput, siteBuildOutput),
				this.buildLambda(sourceOutput, lambdaBuildOutput),
				this.buildCdk(sourceOutput, cdkBuildOutput),
			],
		});

		pipeline.addStage({
			stageName: 'DeployToTest',
			actions: [
				this.createStack(cdkBuildOutput, lambdaBuildOutput, "Test", props),
				this.deployToS3(siteBuildOutput, pipeline, "Test"),
			],
		});

		pipeline.addStage({
			stageName: 'DeployToProd',
			actions: [
				this.createStack(cdkBuildOutput, lambdaBuildOutput, "Prod", props),
				this.deployToS3(siteBuildOutput, pipeline, "Prod"),
			],
		});

	}

	private githubSource(sourceOutput: codepipeline.Artifact) {
		const oauthToken = cdk.SecretValue.secretsManager('virtual-wall-secrets/github/token', { jsonField: 'github-token' });
		const sourceAction = new codepipeline_actions.GitHubSourceAction({
			actionName: 'GitHub_Source',
			owner: "Virtual-Wall-Org",
			repo: "virtual-wall",
			branch: 'master',
			oauthToken: oauthToken,
			output: sourceOutput
		});
		return sourceAction;
	}

	private buildCdk(sourceOutput: codepipeline.Artifact, cdkBuildOutput: codepipeline.Artifact): codepipeline.IAction {
		const cdkBuild = new codebuild.PipelineProject(this, 'VirtualWall-CdkBuild', {
			buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec-cdk.yml"),
			environment: {
				buildImage: BUILD_IMAGE,
			}
		});
		cdkBuild.addToRolePolicy(new iam.PolicyStatement({
			actions: [
				'codebuild:CreateReportGroup',
				'codebuild:CreateReport',
				'codebuild:BatchPutTestCases',
				'codebuild:UpdateReport',
			],
			resources: ['*'],
		}));
		return new codepipeline_actions.CodeBuildAction({
			actionName: 'BuildCDK',
			project: cdkBuild,
			input: sourceOutput,
			outputs: [cdkBuildOutput],
		});
	}

	private buildSite(sourceOutput: codepipeline.Artifact, codeBuildOutput: codepipeline.Artifact): codepipeline.IAction {
		const buildProject = new codebuild.PipelineProject(this, 'VirtualWall-BuildSite', {
			buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec.yml"),
			environment: {
				buildImage: BUILD_IMAGE,
			},
		});
		return new codepipeline_actions.CodeBuildAction({
			actionName: 'BuildSite',
			project: buildProject,
			input: sourceOutput,
			outputs: [codeBuildOutput],
		});
	}

	private buildLambda(sourceOutput: codepipeline.Artifact, lambdaBuildOutput: codepipeline.Artifact): codepipeline.IAction {
		const buildProject = new codebuild.PipelineProject(this, 'VirtualWall-BuildLambda', {
			buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec-lambda.yml"),
			environment: {
				buildImage: BUILD_IMAGE,
			},
		});
		return new codepipeline_actions.CodeBuildAction({
			actionName: 'BuildLambda',
			project: buildProject,
			input: sourceOutput,
			outputs: [lambdaBuildOutput],
		});
	}

	private createStack(cdkBuildOutput: codepipeline.Artifact, lambdaBuildOutput: codepipeline.Artifact, env: string, props: CICDStackProps): codepipeline.IAction {
		const cloudFormationOutput = new codepipeline.Artifact("VirtualWall-CloudFormation" + env)
		return new codepipeline_actions.CloudFormationCreateUpdateStackAction({
			actionName: 'DeployStack' + env,
			templatePath: cdkBuildOutput.atPath('VirtualWallStack.template.json'),
			stackName: 'VirtualWallStack' + env,
			adminPermissions: true,
			parameterOverrides: {
				...props.lambdaCode.assign(lambdaBuildOutput.s3Location),
				environmentName: env,
			},
			extraInputs: [lambdaBuildOutput],
			output: cloudFormationOutput,
			outputFileName: 'cloudformation_output',
			runOrder: 2,
			variablesNamespace: 'cfn' + env
		});
	}

	private deployToS3(codeBuildOutput: codepipeline.Artifact, pipeline: codepipeline.Pipeline, env: string): codepipeline.IAction {
		const role = new iam.Role(this, "WriteToS3" + env, {
			assumedBy: pipeline.role
		});
		role.addToPolicy(new iam.PolicyStatement({
			actions: ['s3:GetObject', 's3:PutObject'],
			resources: ['*'],
		}));
		return new codepipeline_actions.S3DeployAction({
			actionName: 'S3_Deploy' + env,
			bucket: s3.Bucket.fromBucketName(this, 'DeployBucket' + env, '#{cfn' + env + '.bucketName}'),
			input: codeBuildOutput,
			runOrder: 3,
			role: role
		});
	}
}
