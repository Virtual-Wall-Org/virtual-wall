import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';

export class VirtualWallCICDStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceOutput = new codepipeline.Artifact("VirtualWall-Source");
    const oauthToken = cdk.SecretValue.secretsManager('virtual-wall-secrets/github/token', { jsonField: 'github-token' });
    const buildProject = new codebuild.PipelineProject(this, 'VirtualWall-Build', {
      buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec.yml"),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
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
              outputs: [new codepipeline.Artifact()], // optional
            })
          ],
        },
      ],
    });
  }
}
