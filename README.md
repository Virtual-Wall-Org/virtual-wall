# Welcome to Virtual-Wall Project

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands
 * `npm install`     installe l'ensemble des dépendances
 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
### Si cdk est installé en global via -g :
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
### Si cdk est installé en local via npm install du projet:
 * `npm run cdk deploy VirtualWallCICDStack`                         deploy this stack to your default AWS account/region
 * `npm run cdk deploy -- --profile=XXX VirtualWallCICDStack`      deploy this stack to with profile XXX
 * `npm run cdk diff`                                                compare deployed stack with current state
 * `npm run cdk synth`                                               emits the synthesized CloudFormation template

## Organisation

 * /lib is where you can find cdk libraries
 * /static is where you find the application
