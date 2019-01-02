# Monitoring tool

A very (very) simple web monitoring tool in Node.js

## Notice
This project is a short project that I have coded in one hour

## How to use
### Setup
For setting the checker you have to create a file named `config.js` at the root of the folder. This file need to export some variables : 
```javascript
module.exports = {
    lists: [], //list of server to be checked
    interval: 10000 //interval in ms for reloading
    port: 8080 //port for the web server
}
```

The array `lists` is an array of object, for each object you need to specify:

* `name`: The name of the server who gonna be display on the web interface
* `host`: The IP address or the Domain name of the server
* `mode`: A string or an array of different mode of testing
    * `ping`: Just a simple ping (print OK if the ping is positive / print KO if the ping is not positive)
    * `nmap`: Check if a list of port is open or not, if you set `nmap` you need to specify the list of port which need to be open (see `nmap` section) :warning: Currently disabled for security reason
    * `req`: An http request, if you set `req` you need to specify the request and the output there need for testing (see `req_test` section)
* `nmap` (Need to be set if you use the `nmap` mode): Just set an array of port which need to be open. (The array works like an AND, example: if you set [80, 443], the port 80 AND the port 443 need to be open)
* `req_test` (Need to be set if you use the `req` mode): This is an object, you need to set 2 key:
    * `req`: Which is the parameter for the request, for more information go to https://github.com/request/request#requestoptions-callback
    * `output`: Which correpond to the test to make on the request
        * `code` (*optional): A number or an array of number which correspond to the status code of request (The array work like an OR, example: if you set [200, 204], the request need to respond a code 200 OR 204)
        * `text` (*optional): A string or a regular expression, for testing the body response of the request. If you set a string, the body need to correspond strictly to the string, or if you set a regular expression, the body need to match to the regular expression.

### Slack integration
#### Notification
If you want to receive notification through slack when a service crash or is restored, you will need to add two variables in the export of the config:
```javascript
module.exports = {
    service_url: "status.example.org" //(*optional) host of the current service
    slack_hook: "https://hooks.slack.com/services/<TOKEN>/<TOKEN>/<TOKEN>" //slack web hook url
}
```

The `service_url` variable is optional, it permits to add a link in the slack messages to the status page.  
In order to get your `slack_hook` url, follow this page: [https://api.slack.com/incoming-webhooks](https://api.slack.com/incoming-webhooks)

#### Command
You can also configure a slack command for asking the servers status  
Example: 
```
> /infra

< The server "Production" is UP
< The server "Staging" is DOWN
<
< More info on status.example.org
```

In order to setup your slack command you have to create a new application on `https://api.slack.com/apps` (you can reuse the same app created in the `Notification` section).  
Go to `Slash Commands` in the `Features` menu of the app, then, create a new command.  
In `Request URL` set the following url `https://status.example.org/slack` (of course replace the host by your host)

### Use it
Once you have setup your list of server, you have just to launch the project (with `node .` or `node index.js`), and go to http://localhost:8080 (you can change the port at the end of the file)

## Example of setup
- Just a simple ping on a server:
```javascript
        let lists = [
            {
                host: "10.10.0.113",
                name: "Front 1",
                mode: "ping"
            }
        ];
```

- A ping and a nmap test on the web port for a server:
```javascript
        let lists = [
            {
                host: "10.10.0.113",
                name: "Front 1",
                mode : ["ping", "nmap"],
                nmap: [80]
            }
        ];
```
- A nmap test and a HTTP request on a server:
```javascript
        let lists = [
            {
                host: "10.10.0.113",
                name: "Front 1",
                mode: ["nmap", "req"],
                nmap: [80, 443],
                req_test: {
                    req: {
                        uri: "http://api.example.org/v2/auth/token",
                        method: "POST",
                        form: {
                            'username': "test@example.org",
                            'password' : "test123456",
                        }
                    },
                    output: {
                        code: [200, 204],
                        text: /{[\n\s]*status:\s*(true|success)[\n\s]*}/gi
                    }
                }
            }
        ];
```
- A ping test for multiple server:
```javascript
        let lists = [
            {
                host: "10.10.0.113",
                name: "Front 1",
                mode: "ping",
            },
            {
                host: "10.10.0.114",
                name: "Front 2",
                mode: "ping",
            },
            {
                host: "10.10.0.115",
                name: "Front 3",
                mode: "ping",
            }
        ];
```