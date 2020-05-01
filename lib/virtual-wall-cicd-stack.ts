import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from "@aws-cdk/aws-s3";

export class VirtualWallCICDStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cacheBucket = new s3.Bucket(this, "CacheBucket");
    const sourceOutput = new codepipeline.Artifact("VirtualWall-Source");
    const cdkBuildOutput = new codepipeline.Artifact("VirtualWall-Build")
    const codeBuildOutput = new codepipeline.Artifact("VirtualWall-Site-Build")

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
        this.buildProject(cacheBucket, sourceOutput, codeBuildOutput),
        this.buildCdk(cacheBucket, sourceOutput, cdkBuildOutput),
      ],
    });

    pipeline.addStage({
      stageName: 'DeployToTest',
      actions: [
        this.createStack(cdkBuildOutput, "Test"),
        this.deployToS3(codeBuildOutput, pipeline, "Test"),
      ],
    });

    pipeline.addStage({
      stageName: 'DeployToProd',
      actions: [
        this.createStack(cdkBuildOutput, "Prod"),
        this.deployToS3(codeBuildOutput, pipeline, "Prod"),
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

  private buildCdk(cacheBucket: s3.Bucket, sourceOutput: codepipeline.Artifact, cdkBuildOutput: codepipeline.Artifact): codepipeline.IAction {
    const cdkBuild = new codebuild.PipelineProject(this, 'VirtualWall-CdkBuild', {
      buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec-cdk.yml"),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
      cache : codebuild.Cache.bucket(cacheBucket),
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
      actionName: 'CDKBuild',
      project: cdkBuild,
      input: sourceOutput,
      outputs: [cdkBuildOutput],
    });
  }

  private buildProject(cacheBucket: s3.Bucket, sourceOutput: codepipeline.Artifact, codeBuildOutput: codepipeline.Artifact): codepipeline.IAction {
    const buildProject = new codebuild.PipelineProject(this, 'VirtualWall-Build', {
      buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec.yml"),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
      cache : codebuild.Cache.bucket(cacheBucket),
    });
    return new codepipeline_actions.CodeBuildAction({
      actionName: 'CodeBuild',
      project: buildProject,
      input: sourceOutput,
      outputs: [codeBuildOutput],
    });
  }

  private createStack(cdkBuildOutput: codepipeline.Artifact, env: string): codepipeline.IAction {
    const cloudFormationOutput = new codepipeline.Artifact("VirtualWall-CloudFormation" + env)
    return new codepipeline_actions.CloudFormationCreateUpdateStackAction({
      actionName: 'DeployStack' + env,
      templatePath: cdkBuildOutput.atPath('VirtualWallStack.template.json'),
      stackName: 'VirtualWallStack' + env,
      adminPermissions: true,
      extraInputs: [cdkBuildOutput],
      output: cloudFormationOutput,
      outputFileName: 'cloudformation_output',
      runOrder: 2,
      variablesNamespace: 'cfn' + env
    });
  }

  private deployToS3(codeBuildOutput: codepipeline.Artifact, pipeline: codepipeline.Pipeline, env: string): codepipeline.IAction {
    const role = new iam.Role(this, "WriteToS3" + env, {
      assumedBy : pipeline.role
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
