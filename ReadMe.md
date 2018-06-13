# Monitoring tool

A very (very) simple web monitoring tool in Node.js

## Notice
This project is a short project that I have coded in one hour (please don't judge my code)

## How to use
### Setup
At the begining of the file `index.js` you have a variable named lists which is an array, you have to fill this array with the server you want to monitor.

This array is an array of object, for each object you need to specify:

* `name`: The name of the server who gonna be display on the web interface
* `host`: The IP address or the Domain name of the server
* `mode`: A string or an array of different mode of testing
    * `ping`: Just a simple ping (print OK if the ping is positive / print KO if the ping is not positive)
    * `nmap`: Check if a list of port is open or not, if you set `nmap` you need to specify the list of port which need to be open (see `nmap` section)
    * `req`: An http request, if you set `req` you need to specify the request and the output there need for testing (see `req_test` section)
* `nmap` (Need to be set if you use the `nmap` mode): Just set an array of port which need to be open. (The array works like an AND, example: if you set [80, 443], the port 80 AND the port 443 need to be open)
* `req_test` (Need to be set if you use the `req` mode): This is an object, you need to set 2 key:
    * `req`: Which is the parameter for the request, for more information go to https://github.com/request/request#requestoptions-callback
    * `output`: Which correpond to the test to make on the request
        * `code` (*optional): A number or an array of number which correspond to the status code of request (The array work like an OR, example: if you set [200, 204], the request need to respond a code 200 OR 204)
        * `text` (*optional): A string or a regular expression, for testing the body response of the request. If you set a string, the body need to correspond strictly to the string, or if you set a regular expression, the body need to match to the regular expression.

### Use it
Once you have setup your list of server, you have just to launch the project (with `node .` or `node index.js`), and go to http://localhost:8080 (you can change the port at the end of the file)

## Example of setup
- Just a simple ping on a server:

        let lists = [
            {
                host: "10.10.0.113",
                name: "Front 1",
                mode: "ping"
            }
        ];

- A ping and a nmap test on the web port for a server:

        let lists = [
            {
                host: "10.10.0.113",
                name: "Front 1",
                mode : ["ping", "nmap"],
                nmap: [80]
            }
        ];

- A nmap test and a HTTP request on a server:

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
                        text: /{(.*)}/gi
                    }
                }
            }
        ];

- A ping test for multiple server:

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