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
    const buildOutput = new codepipeline.Artifact("VirtualWall-Build")
    const oauthToken = cdk.SecretValue.secretsManager('virtual-wall-secrets/github/token', { jsonField: 'github-token' });
    
    const buildProject = new codebuild.PipelineProject(this, 'VirtualWall-Build', {
      buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec.yml"),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
      cache : codebuild.Cache.bucket(cacheBucket),
    });
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'codebuild:CreateReportGroup',
        'codebuild:CreateReport',
        'codebuild:BatchPutTestCases',
        'codebuild:UpdateReport',
      ],
      resources: ['*'],
    }));

    const cdkBuild = new codebuild.PipelineProject(this, 'VirtualWall-CdkBuild', {
      buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec-cdk.yml"),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
      cache : codebuild.Cache.bucket(cacheBucket),
    });

    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: "Virtual-Wall-Org",
      repo: "virtual-wall",
      branch: 'master',
      oauthToken: oauthToken,
      output: sourceOutput
    });

    new codepipeline.Pipeline(this, 'VirtualWall-Pipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [
            sourceAction
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'CodeBuild',
              project: buildProject,
              input: sourceOutput,
              outputs: [], 
            }),
            new codepipeline_actions.CodeBuildAction({
              actionName: 'CDKBuild',
              project: cdkBuild,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: 'DeployStack',
              templatePath: buildOutput.atPath('VirtualWallStack.template.json'),
              stackName: 'VirtualWallStack',
              adminPermissions: true,
              extraInputs: [buildOutput],
            }),
          ],
        },
      ],
    });
  }
}
