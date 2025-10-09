# webexcc-clicktocall
Webex Contact Center click2call middleware for CRMs and ERPs

## Features
* Receive the GET or POST HTTP request to make a click2call between CRM or ERP and the Webex Contact Center Desktop.

## Compile and install
1. Update the Ubuntu Distro
```Shell
$ sudo apt update
$ sudo apt upgrade
```

2. Install the dependencies
```Shell
$ npm install
```
3. Create one Webex CC integration on [Webex CX developer portal](https://developer.webex-cx.com/documentation/integrations/#registering-your-integration)  

4. Configure the .env, here is an example
```Shell
PORT = 3000
WXC_API_URL = https://webexapis.com
WXCC_API_URL = https://api.wxcc-us1.cisco.com
WXCC_API_CLIENT_ID = 
WXCC_API_CLIENT_SECRET = 
WXCC_API_REDIRECT_URI = <url>/webexcc/auth/callback
WXCC_API_SCOPES = cjp:user cjp:config cjp:config_read spark:people_read
WXCC_API_ORG_ID = 

WXCC_TASK_ENTRYPOINT_ID = 
WXCC_TASK_DIRECTION = OUTBOUND
WXCC_TASK_MEDIA_TYPE = telephony
WXCC_TASK_OUTBOUND_TYPE = OUTDIAL
```
