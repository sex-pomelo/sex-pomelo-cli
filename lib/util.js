'use strict';

const cliff = require('cliff');
const async = require('async');
const crypto = require('crypto');
const consts = require('./consts');
const eyes = require('eyes')

cliff.inspect = eyes.inspector({ stream: null,
	styles: {               // Styles applied to stdout
    all:     null,        // Overall style applied to everything
    label:   'underline', // Inspection labels, like 'array' in `array: [1, 2, 3]`
    other:   'inverted',  // Objects which don't have a literal representation, such as functions
    key:     'red',      // The keys in object literals, like 'a' in `{a: 1}`
    special: 'grey',      // null, undefined...
    number:  'blue',      // 0, 1, 2...
    bool:    'magenta',   // true false
    regexp:  'green'      // /\d+/
  }});

let util = {};

module.exports = util;

let serverMap = {};

function log(str) {
	process.stdout.write(str + '\n');
}

function help() {
	let HELP_INFO_1 = consts.HELP_INFO_1;
	for (let i = 0; i < HELP_INFO_1.length; i++) {
		util.log(HELP_INFO_1[i]);
	}

	let COMANDS_ALL = consts.COMANDS_ALL;
	util.log(cliff.stringifyRows(COMANDS_ALL));

	let HELP_INFO_2 = consts.HELP_INFO_2;
	for (let i = 0; i < HELP_INFO_2.length; i++) {
		util.log(HELP_INFO_2[i]);
	}
}

function errorHandle(comd, rl) {
	log('\nunknow command : ' + comd);
	log('type help for help infomation\n');
	rl.prompt();
}

function argsFilter(argv) {
	let lines;
	if(argv.indexOf('\'') > 0) { 
		lines = argv.split('\'');
	}
  let getArg = function(argv) {
		let argvs = argv.split(' ');
		for (let i = 0; i < argvs.length; i++) {
			if (argvs[i] === ' ' || argvs[i] === '') {
				argvs.splice(i, 1);
			}
		}
		return argvs;
  };
	if(!!lines) {
		let head = getArg(lines[0]);
		for(let i = 1; i < lines.length-1; i++) {
			head = head.concat(lines[i]);
		}
		let bottom = getArg(lines[lines.length-1]);
		return head.concat(bottom);
	} else {
		return getArg(argv);
  }
}

function formatOutput(comd, data) {

	
	switch( comd ){
		case 'servers':
		{
			let msg = data;
			let rows = [];
			let header = [];
			let results = [];
			serverMap = {};
			serverMap["all"] = 1;
			header.push(['id', 'serverType', 'host', 'port', 'pid','rss(M)', 'heap(M)','uptime(m)']);
			let color = getColor(header[0].length);
			for (let key in msg) {
				let server = msg[key].serverInfo;
				if (!server['port']) {
					server['port'] = null;
				}
				let rss = server.rss || 0;
				let heapTotal = server.heapTotal || 0;
				let heapUsed = server.heapUsed || 0;
							
				serverMap[server['id']] = 1;
				rows.push([server['id'], server['serverType'], server['host'], server['port'], server['pid'],
				rss,heapUsed +"/" +heapTotal,
				server.uptime]);
			}
			async.sortBy(rows, function(server, callback) {
				callback(null, server[0]);
			}, function(err, _results) {
				results = header.concat(_results);
				log('\n' + cliff.stringifyRows(results, color) + '\n');
				return;
			});
		}break;
		case 'connections': //format all servers' connections
		{
			let msg = (typeof(data) === 'string')?JSON.parse(data):data;
			let rows = [];
			let header = [];
			let results = [];
			let color = getColor(3);
			header.push(['serverId', 'totalConnCount', 'loginedCount']);
			for (let key in msg) {
				let server = msg[key].connectionInfo;
				if (typeof server === 'string') {
					rows.push([key, 0, 0]);
				} else {
					rows.push([server['serverId'], server['totalConnCount'], server['loginedCount']]);
				}
			}
			async.sortBy(rows, function(server, callback) {
				callback(null, server[0]);
			}, function(err, _results) {
				results = header.concat(_results);
				log('\n' + cliff.stringifyRows(results, color) + '\n');
				return;
			});
		}break;
		case 'components':
		{
			let msg = JSON.parse(data);
			log('\n' + cliff.inspect(msg.componentInfo) + '\n');
		}break;
		case 'settings':
		{
			let msg = JSON.parse(data);
			log('\n' + cliff.inspect(msg.settingInfo) + '\n');
		}break;
		case 'get':
		case 'set':
		case 'exec':
		case 'run':
		{
			log('\n' + cliff.inspect(data) + '\n');
		}break;
		case 'proxy':
		{
			let msg = JSON.parse(data);
			log('\n' + cliff.inspect(msg.proxyInfo) + '\n');
		}break;
		case 'handler':
		{
			let msg = JSON.parse(data);
			log('\n' + cliff.inspect(msg.handlerInfo) + '\n');
		}break;
		case 'stop':
		case 'add':
		{

		}break;
		case 'status':
		{
			let msg = JSON.parse(data);
			if( msg.statusInfo !== undefined){
				let server = msg.statusInfo;
				let rows = [];
				rows.push(['time', 'serverId', 'serverType', 'pid', 'cpuAvg', 'memAvg', 'vsz', 'rss', 'usr', 'sys', 'gue']);
				let color = getColor(rows[0].length);
				if (server) {
					rows.push([server['time'], server['serverId'], server['serverType'], server['pid'], server['cpuAvg'], server['memAvg'], server['vsz'], server['rss'], server['usr'], server['sys'], server['gue']]);
					log('\n' + cliff.stringifyRows(rows, color) + '\n');
				} else {
					log('\n' + consts.STATUS_ERROR + '\n');
				}
			}else{
				log('\n' + cliff.inspect(msg.err) + '\n');
			}
		}break;
		default:
		{
			log('\n' + cliff.inspect(data) + '\n');
		}break;
	}
}

function format_date(date, friendly) {
	let year = date.getFullYear();
	let month = date.getMonth() + 1;
	let day = date.getDate();
	let hour = date.getHours();
	let minute = date.getMinutes();
	let second = date.getSeconds();

	if (friendly) {
		let now = new Date();
		let mseconds = -(date.getTime() - now.getTime());
		let time_std = [1000, 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000];
		if (mseconds < time_std[3]) {
			if (mseconds > 0 && mseconds < time_std[1]) {
				return Math.floor(mseconds / time_std[0]).toString() + ' 秒前';
			}
			if (mseconds > time_std[1] && mseconds < time_std[2]) {
				return Math.floor(mseconds / time_std[1]).toString() + ' 分钟前';
			}
			if (mseconds > time_std[2]) {
				return Math.floor(mseconds / time_std[2]).toString() + ' 小时前';
			}
		}
	}

	//month = ((month < 10) ? '0' : '') + month;
	//day = ((day < 10) ? '0' : '') + day;
	hour = ((hour < 10) ? '0' : '') + hour;
	minute = ((minute < 10) ? '0' : '') + minute;
	second = ((second < 10) ? '0' : '') + second;

	return year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
};

function getColor(len) {
	let color = [];
	for (let i = 0; i < len; i++) {
		color.push('blue');
	}
	return color;
}

function md5(str) {
	let md5sum = crypto.createHash('md5');
	md5sum.update(str);
	str = md5sum.digest('hex');
	return str;
}

function tabComplete(hits, line, map, comd) {
	if(hits.length) {
		return hits;
	}

	if (comd === "enable" || comd === "disable") {
		map = {
			"app": 1,
			"module": 1
		};
	} 

	if (comd === "dump") {
		map = {
			"memory": 1,
			"cpu": 1
		};
	}

	if (comd === "use" || comd === "stop") {
		map = serverMap;
	}

	// let _hits = [];
	for (let k in map) {
	  let t = k;
	  if(comd !== "complete") {
	    t = comd + " " + k;
	  }
      if (t.indexOf(line) === 0) {
        hits.push(t);
      }
    }

    hits.sort();
    return hits;
}

function startsWith (str, prefix) {
  if (typeof str !== 'string' || typeof prefix !== 'string' ||
    prefix.length > str.length) {
    return false;
  }

  return str.indexOf(prefix) === 0;
}

util.log = log;
util.md5 = md5;
util.help = help;
util.tabComplete = tabComplete;
util.argsFilter = argsFilter;
util.format_date = format_date;
util.errorHandle = errorHandle;
util.formatOutput = formatOutput;
util.startsWith = startsWith;