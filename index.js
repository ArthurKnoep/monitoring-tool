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

const express = require('express');
const serveStatic = require('serve-static');
let ping = require('ping');
// let libnmap = require('libnmap');
let request = require('request');
let config = require('./config');

function ping_host(host) {
	return new Promise((resolve, reject) => {
		ping.sys.probe(host, function (isAlive) {
			resolve(isAlive);
		});
	});
}

// function nmap_host(host) {
//     return new Promise((resolve, reject) => {
//         let opt = {
//             range: [host]
//         };
//         libnmap.scan(opt, function(err, report) {
//             if (err) { reject(err); return; };
//             resolve(report[host].host[0].ports[0]);
//         });
//     });
// }

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
			ret.group = serv.group;
			if ((typeof serv.mode === "string" && serv.mode == "ping") || (typeof serv.mode === "object" && serv.mode.indexOf("ping") !== -1)) {
				ping_host(serv.host).then((isAlive) => {
					ret.ping = isAlive;
					nbMode -= 1;
					if (nbMode <= 0)
						resolve(ret);
				});
			}
			// if ((typeof serv.mode === "string" && serv.mode == "nmap") || (typeof serv.mode === "object" && serv.mode.indexOf("nmap") !== -1)) {
			//     nmap_host(serv.host).then((data) => {
			//         let l_port = [];
			//         for (idx in data.port) {
			//             if (data.port[idx].state[0].item.state === "open")
			//                 l_port.push(parseInt(data.port[idx].item.portid));
			//         }
			//         ret.nmap = true;
			//         ret.nmap_message = [];
			//         for (idx in serv.nmap) {
			//             if (l_port.indexOf(serv.nmap[idx]) === -1) {
			//                 ret.nmap = false;
			//                 ret.nmap_message.push("Le port "+serv.nmap[idx]+" n'est pas joignable");
			//             }
			//         }
			//         nbMode -= 1;
			//         if (nbMode <= 0)
			//             resolve(ret);
			//     }, (err) => {
			//         ret.req = false;
			//         nbMode -= 1;
			//         if (nbMode <= 0)
			//             resolve(ret);
			//     })
			// }
			if ((typeof serv.mode === "string" && serv.mode == "req") || (typeof serv.mode === "object" && serv.mode.indexOf("req") !== -1)) {
				request(serv.req_test.req, (error, respObj, response) => {
					if (error) {
						ret.req = false;
						ret.req_message = ["Error: " + (error.code || "Unknow error")];
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
		config.lists.forEach(function (serv, idx) {
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
	return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear() + " " + ((d.getHours() < 10) ? "0" : "") + d.getHours() + ":" + ((d.getMinutes() < 10) ? "0" : "") + d.getMinutes() + ":" + ((d.getSeconds() < 10) ? "0" : "") + d.getSeconds();
}

function send_slack_msg(msg) {
	request({
		url: config.slack_hook,
		method: 'POST',
		json: {
			text: msg
		}
	});
}

function add_to_send(to_send, msg) {
	if (to_send.length)
		to_send += "\n";
	to_send += msg;
	return to_send;
}

function test_serv(list) {
	let to_send = "";
	list.forEach((serv) => {
		if (serv.ping === false || serv.nmap === false || serv.req === false) {
			if (down_serv[serv.name] === config.min_try) {
				to_send = add_to_send(to_send, `The server "${serv.name}" is DOWN`);
				down_serv[serv.name] = (down_serv[serv.name] || 0)  + 1;
			} else if (!down_serv[serv.name] || down_serv[serv.name] < config.min_try) {
				down_serv[serv.name] = (down_serv[serv.name] || 0)  + 1;
			}
		} else {
			if (down_serv[serv.name] > config.min_try) {
				to_send = add_to_send(to_send, `The server "${serv.name}" is UP`);
			}
			down_serv[serv.name] = undefined;
		}
	});
	if (to_send.length) {
		if (config.service_url)
			to_send += `\n\nMore info on <https://${config.service_url}/|${config.service_url}>`;
		send_slack_msg(to_send);
	}
}

function get_slack_cmd_msg(list) {
	let to_send = "";

	list.forEach((serv) => {
		if (serv.ping === false || serv.nmap === false || serv.req === false)
			to_send = add_to_send(to_send, `The server "${serv.name}" is DOWN`);
		else
			to_send = add_to_send(to_send, `The server "${serv.name}" is UP`);
	});
	if (to_send.length && config.service_url)
		to_send += `\n\nMore info on <https://${config.service_url}/|${config.service_url}>`;
	return to_send;
}

function get_groups(list) {
	let groups = [];
	list.forEach((serv) => {
		if (serv.group !== undefined && groups.indexOf(serv.group) === -1)
			groups.push(serv.group);
	})
	return groups;
}

let status = [];
let groups = get_groups(config.lists);
let down_serv = [];
let last_load = "Waiting data";
let last_update = new Date();

function fetch_serv() {
	get_list_up().then((data) => {
		status = data;
		last_load = get_date();
		last_update = new Date();
		if (typeof config.slack_hook === "string")
			test_serv(data);
	}, (err) => {
		console.error(err);
	});
}

setInterval(() => {
	fetch_serv();
}, config.interval);
fetch_serv();

let app = express();

app
	.use("/assets", serveStatic('assets'))
	.all("/", (req, res) => {
		res.render("template.ejs", {
			servers: status,
			groups,
			last_load: last_load
		});
	})
	.all('/json', (req, res) => {
		res.json({
			last_update: last_update,
			data: status
		});
	})
	.all('/slack', (req, res) => {
		res.json({
			text: get_slack_cmd_msg(status)
		});
	})
	.use((req, res) => {
		res.sendStatus(404);
	})

app.listen((config.port || 8080), () => {
	console.log("Listening on", (config.port || 8080))
});
