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

3. Configure the .env
```Shell
PORT = 3000
WXCC_API_URL = https://api.wxcc-us1.cisco.com
WXCC_ENTRYPOINT_ID = 0e6e8696-2af7-4949-b357-983db7340bf2
WXCC_DIRECTION = OUTBOUND
WXCC_TASK_MEDIA_TYPE = telephony
WXCC_TASK_OUTBOUND_TYPE = OUTDIAL
WXCC_ENTRYPOINT_ID = <WebexCC Entrypoint>
```
