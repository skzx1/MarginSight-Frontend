"""Apply presentation-only branding to the existing classic Cognito app client.

Run in authorized Singapore CloudShell with boto3. Does not change client scopes,
credentials, users or authentication policies. Existing customization is backed up.
"""
import hashlib
import json
import datetime
from pathlib import Path
from urllib.parse import urlparse
import boto3

root = Path(__file__).resolve().parent.parent
account = boto3.client('sts').get_caller_identity()['Account']
assert account == '109991964227', 'Unexpected deployment account'
cf = boto3.client('cloudformation', region_name='ap-southeast-1')
stack = cf.describe_stacks(StackName='marginsight')['Stacks'][0]
assert stack['StackStatus'] in {'CREATE_COMPLETE', 'UPDATE_COMPLETE'}
outputs = {v['OutputKey']: v['OutputValue'] for v in stack['Outputs']}
pool, client = outputs['UserPoolId'], outputs['ClientId']
assert pool.startswith('ap-southeast-1_')
domain = urlparse(outputs['AuthDomain']).hostname.split('.')[0]
cognito = boto3.client('cognito-idp', region_name='ap-southeast-1')
details = cognito.describe_user_pool_domain(Domain=domain)['DomainDescription']
assert details['AWSAccountId'] == account and details['UserPoolId'] == pool
assert details.get('ManagedLoginVersion', 1) == 1, 'Requires existing classic hosted UI'
client_before = cognito.describe_user_pool_client(UserPoolId=pool, ClientId=client)['UserPoolClient']
before = cognito.get_ui_customization(UserPoolId=pool, ClientId=client)['UICustomization']
evidence = root / '.local'
evidence.mkdir(exist_ok=True)
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%f')
backup = evidence / ('cognito-ui-before-' + stamp + '.json')
backup.write_text(json.dumps({k:before.get(k) for k in ['CSS','ImageUrl','CSSVersion']},indent=2),encoding='utf-8')
css = (root / 'web/branding/cognito.css').read_text(encoding='utf-8')
logo = (root / 'web/branding/cognito-logo.png').read_bytes()
assert len(css.encode()) < 3072 and len(logo) < 100000
result = cognito.set_ui_customization(UserPoolId=pool, ClientId=client, CSS=css, ImageFile=logo)['UICustomization']
after = cognito.get_ui_customization(UserPoolId=pool, ClientId=client)['UICustomization']
assert after['CSS'] == css
assert cognito.describe_user_pool_client(UserPoolId=pool, ClientId=client)['UserPoolClient'] == client_before, 'App client authentication settings changed'
report = {'account':account,'region':'ap-southeast-1','classicBranding':True,
          'cssSha256':hashlib.sha256(css.encode()).hexdigest(),
          'cssVersion':after.get('CSSVersion'),'hasLogo':bool(after.get('ImageUrl')),
          'logoSha256':hashlib.sha256(logo).hexdigest(), 'logoUrl':after.get('ImageUrl'),
          'backup':str(backup),'authPoliciesChanged':False,'appClientUnchanged':True,'readBackMatched':True}
(evidence/'cognito-ui-after.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
