#!/usr/bin/env bash
set -euo pipefail
export AWS_PAGER=""
export AWS_DEFAULT_REGION=ap-southeast-1
[[ "$(aws sts get-caller-identity --query Account --output text)" == "109991964227" ]] || exit 1
cd "$(dirname "$0")/.."
aws cloudformation describe-stacks --stack-name marginsight --query 'Stacks[0].Outputs' --output json > deploy-outputs.json
python3 - <<'PY'
import json
outputs={x['OutputKey']:x['OutputValue'] for x in json.load(open('deploy-outputs.json'))}
json.dump({'apiUrl':outputs['ApiUrl'],'authDomain':outputs['AuthDomain'],'clientId':outputs['ClientId']},open('web/out/config.json','w'),indent=2)
PY
bucket="$(python3 -c "import json; print(next(x['OutputValue'] for x in json.load(open('deploy-outputs.json')) if x['OutputKey']=='WebBucket'))")"
aws s3 sync web/out/ "s3://$bucket/" --cache-control 'public,max-age=300' --exclude '*.html' --exclude 'config.json'
aws s3 sync web/out/ "s3://$bucket/" --cache-control 'no-store' --exclude '*' --include '*.html' --include 'config.json'
python3 - <<'PY'
import json,urllib.request
o={x['OutputKey']:x['OutputValue'] for x in json.load(open('deploy-outputs.json'))}
assert json.load(urllib.request.urlopen(o['ApiUrl']+'/health'))['service']=='MarginSight'
print('Public health PASS. User login/store/browser gates remain. Web:',o['WebUrl'])
PY
