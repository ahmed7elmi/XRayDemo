#!/bin/bash

echo installing dependencies
npm i
cp -a node_modules/ sendRequest/node_modules/
cp -a node_modules/ handleRequests/node_modules/
echo "Press any key to continue"
read x



PROJECT=xray-demo
BUCKET=rcw-new-request-05
PROFILE="cpaas"


#echo -n $redis_ep && exit 1
#region="eu-west-1"

#echo Removing old build resources 
#rm -rf  build
#mkdir build

echo validating template file 
sam validate
echo "Press any key to continue"
read x

echo "Packaging the sam template"
aws cloudformation package --template-file template.yaml \
                           --output-template-file build/output.yaml \
                           --s3-bucket $BUCKET --profile $PROFILE

echo "Press any key to continue"
read x

echo "Deploying the sam template"
aws cloudformation deploy --template-file build/output.yaml \
                          --stack-name $PROJECT \
                          --parameter-overrides STAGE=Prod \
                          --capabilities CAPABILITY_IAM --profile $PROFILE
echo "Press any key to continue"
read x

echo "Descibing the stack"
aws cloudformation describe-stacks --stack-name $PROJECT --profile $PROFILE

