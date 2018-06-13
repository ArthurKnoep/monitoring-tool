/*
** index.js for up_up in /index.js
**
** Made by Arthur Knoepflin
** Login arthur.knoepflin@epitech.eu
**
** Started on Thu Oct 05 2017 12:17:42
** Last update Thu Oct 05 15:42:13 2017
** By Arthur Knoepflin
*/

let express = require("express");
let ping = require('ping');
let libnmap = require('libnmap');
let request = require('request');

let interval = 10000;
let lists = [
  // Place the list of server you want to monitor
];

function ping_host(host) {
    return new Promise((resolve, reject) => {
        ping.sys.probe(host, function(isAlive) {
            resolve(isAlive);
        });
    });
}

function nmap_host(host) {
    return new Promise((resolve, reject) => {
        let opt = {
            range: [host]
        };
        libnmap.scan(opt, function(err, report) {
            if (err) { reject(err); return; };
            resolve(report[host].host[0].ports[0]);
        });
    });
}

function trace_serv(serv) {
    return new Promise((resolve, reject) => {
        let ret = {};
        let nbMode = 0;
        if (typeof serv.mode === "string") {
            nbMode = 1;
        } else if (typeof serv.mode === "object") {
            nbMode = serv.mode.length;
        }
        if (nbMode === 0) {
            resolve({});
        } else {
            ret.name = serv.name;
            ret.host = serv.host;
            if ((typeof serv.mode === "string" && serv.mode == "ping") || (typeof serv.mode === "object" && serv.mode.indexOf("ping") !== -1)) {
                ping_host(serv.host).then((isAlive) => {
                    ret.ping = isAlive;
                    nbMode -= 1;
                    if (nbMode <= 0)
                        resolve(ret);
                });
            }
            if ((typeof serv.mode === "string" && serv.mode == "nmap") || (typeof serv.mode === "object" && serv.mode.indexOf("nmap") !== -1)) {
                nmap_host(serv.host).then((data) => {
                    let l_port = [];
                    for (idx in data.port) {
                        if (data.port[idx].state[0].item.state === "open")
                            l_port.push(parseInt(data.port[idx].item.portid));
                    }
                    ret.nmap = true;
                    ret.nmap_message = [];
                    for (idx in serv.nmap) {
                        if (l_port.indexOf(serv.nmap[idx]) === -1) {
                            ret.nmap = false;
                            ret.nmap_message.push("Le port "+serv.nmap[idx]+" n'est pas joignable");
                        }
                    }
                    nbMode -= 1;
                    if (nbMode <= 0)
                        resolve(ret);
                }, (err) => {
                    ret.req = false;
                    nbMode -= 1;
                    if (nbMode <= 0)
                        resolve(ret);
                })
            }
            if ((typeof serv.mode === "string" && serv.mode == "req") || (typeof serv.mode === "object" && serv.mode.indexOf("req") !== -1)) {
                request(serv.req_test.req, (error, respObj, response) => {
                    if (error) {
                        ret.req = false;
                        if (error && error.code == "ETIMEDOUT") {
                            ret.req_message = ["Timeout"];
                        } else {
                            ret.req_message = ["Unknown error"];
                        }
                    } else {
                        ret.req = true;
                        ret.req_message = [];
                        if (typeof serv.req_test.output.code == "number" || typeof serv.req_test.output.code == "object") {
                            if (typeof serv.req_test.output.code == "number") {
                                serv.req_test.output.code = [serv.req_test.output.code];
                            }
                            if (serv.req_test.output.code.indexOf(respObj.statusCode) === -1) {
                                ret.req = false;
                                ret.req_message.push("Status code : " + respObj.statusCode);
                            }
                        }
                        if (typeof serv.req_test.output.text === "string") {
                            if (response !== serv.req_test.output.text) {
                                ret.req = false;
                                ret.req_message.push("Body incorrect");
                            }
                        }
                        if (typeof serv.req_test.output.text === "object") {
                            if (!serv.req_test.output.text.exec(response)) {
                                ret.req = false;
                                ret.req_message.push("Body incorrect : \n" + response);
                            }
                        }
                    }
                    nbMode -= 1;
                    if (nbMode <= 0)
                        resolve(ret);
                });
            }
        }
    });
}

function get_list_up() {
    return new Promise((resolve, reject) => {
        let promises = [];
        lists.forEach(function(serv, idx) {
            promises[idx] = trace_serv(serv);
        }, this);
        Promise.all(promises).then((data) => {
            resolve(data);
        }, (err) => {
            console.error(err);
            reject(err);
        });
    });
}

function get_date() {
    let d = new Date();
    return d.getDate()+"/"+(d.getMonth() + 1)+"/"+d.getFullYear()+" "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
}

let status = [];
let last_load = "Waiting data";

setInterval(() => {
    get_list_up().then((data) => {
        status = data;
        last_load = get_date();
    }, (err) => {
        console.error(err);
    });
}, interval);

get_list_up().then((data) => {
    status = data;
    last_load = get_date();
}, (err) => {
    console.error(err);
});

let app = express();

app.all("/", (req, res) => {
    res.render("main.ejs", {
        servers: status,
        last_load: last_load
    });
});

app.listen(8080);
