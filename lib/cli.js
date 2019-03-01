'use strict';

const readline = require('readline');
const Redis = require('ioredis');
const command = require('./command')();
const consts = require('./consts');
const util = require('./util');
const argv = require('optimist').argv;
const cliff = require('cliff');
const path  = require('path');
let startupArgs = {"env":'development'};

const username = argv['u'] = argv['u'] || '';

let context = 'all';
let client = null;

let env = argv['e'] || 'development';

module.exports = doConnect;

function doConnect( cfgPath ) {
    startupArgs = require( path.resolve(cfgPath) );
    redisConnect();
}


function redisConnect() {
  if( typeof(startupArgs.keyPre) !== 'string' ){
    startupArgs.keyPre = 'sexp';
  }
  
  if(startupArgs.redisNodes.nodes.length === 1 ) {
    client = new Redis(startupArgs.redisNodes.nodes[0].port, 
        startupArgs.redisNodes.nodes[0].host, 
        startupArgs.redisOpts);
  } else if(startupArgs.redisNodes.nodes.length > 1)  {
    client = new Redis({
      sentinels: startupArgs.redisNodes.nodes,
      name: startupArgs.redisNodes.name,
      password: startupArgs.password
    }, startupArgs.redisOpts);
  } else {
    console.log( "no redis nodes info!" );
    process.exit(0);
  }

  if( argv['e'] ){
      env = argv['e'];
  }else{
      if( typeof(startupArgs.env) === 'string'){
        env = startupArgs.env;
      }else{
        env = 'development';
      }
  }

  command.setEnv({
    prefix:`${startupArgs.keyPre}-reg:`,
    serPrefix:`${startupArgs.keyPre}-ser:`,
    resPrefix:`${startupArgs.keyPre}-reg-res:`,
    env:env
  });

  let rows2 = [
    ['key:'.bold,  command.redisCfg.prefix.inverse],
    ['env:'.bold,  env.inverse]
  ];
 
  console.log( cliff.stringifyRows( rows2));

  client.once('connect', function() {
    util.log('connected to redis successfully !\n');
    let ASCII_LOGO = consts.ASCII_LOGO;
    for (let i = 0; i < ASCII_LOGO.length; i++) {
      util.log(ASCII_LOGO[i]);
    }

    if( startupArgs.password ){
      client.auth(startupArgs.password);
    }

    let WELCOME_INFO = consts.WELCOME_INFO;
    for (let i = 0, l = WELCOME_INFO.length; i < l; i++) {
      util.log(WELCOME_INFO[i]);
    }
    startCli();
  });

  client.on('end', function() {
    util.log('\ndisconnect from redis server\n');
    process.exit(0);
  });
}

function startCli() {
  let rl = readline.createInterface(process.stdin, process.stdout, completer);
  let PROMPT = username + consts.PROMPT + context +'>';
  rl.setPrompt(PROMPT);
  rl.prompt();

  rl.on('line', function(line) {
    let key = line.trim();
    if (!key) {
      util.help();
      rl.prompt();
      return;
    }
    switch (key) {
      case 'help':
        util.help();
        rl.prompt();
        break;
      case '?':
        util.help();
        rl.prompt();
        break;
      case 'quit':
        command.quit(rl);
        break;
      default:
        command.handle(key, {
          user: username,
          env : env
        }, rl, client);
        break;
    }
  }).on('close', function() {
    util.log('bye ' + username);
    process.exit(0);
  });
}

function completer(line) {
  line = line.trim();
  let completions = consts.COMANDS_COMPLETE;
  let hits = [];
  // commands tab for infos 
  if (consts.COMPLETE_TWO[line]) {
    if (line === "show") {
      for (let k in consts.SHOW_COMMAND) {
        hits.push(k);
      }
    } else if (line === "help") {
      for (let k in consts.COMANDS_COMPLETE_INFO) {
        hits.push(k);
      }
    } else if (line === "enable" || line === "disable") {
      hits.push("app");
      hits.push("module");
    } else if (line === "dump") {
      hits.push("memory");
      hits.push("cpu");
    }
  }

  hits = util.tabComplete(hits, line, consts.COMANDS_COMPLETE_INFO, "complete");
  hits = util.tabComplete(hits, line, consts.COMANDS_COMPLETE_INFO, "help");
  hits = util.tabComplete(hits, line, consts.SHOW_COMMAND, "show");
  hits = util.tabComplete(hits, line, null, "enable");
  hits = util.tabComplete(hits, line, null, "disable");
  hits = util.tabComplete(hits, line, null, "disable");
  hits = util.tabComplete(hits, line, null, "dump");
  hits = util.tabComplete(hits, line, null, "use");
  hits = util.tabComplete(hits, line, null, "stop");
   
  // show all completions if none found
  return [hits.length ? hits : completions, line];
}
