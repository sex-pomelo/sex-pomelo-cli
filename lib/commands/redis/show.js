'use strict';

const util = require('../../util');
const consts = require('../../consts');

module.exports = function(opts) {
    return new Command(opts);
};

module.exports.commandId = 'show';
module.exports.helpCommand = 'help show';

let Command = function(opt) {

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg) {
  if (!comd) {
    agent.handle(module.exports.helpCommand, msg, rl, client);
    return;
  }

  let Context = agent.getContext();
  let argvs = util.argsFilter(argv);
  let param = "";

  if (argvs.length > 2 && comd !== 'config') {
    agent.handle(module.exports.helpCommand, msg, rl, client);
    return;
  }

  if (argvs.length > 3 && comd === 'config') {
    agent.handle(module.exports.helpCommand, msg, rl, client);
    return;
  }

  if (argvs.length === 3 && comd === 'config') {
        param = argvs[2];
  }

  let user = msg['user'] || 'admin';

  if (Context === 'all' && consts.CONTEXT_COMMAND[comd]) {
    util.log('\n' + consts.COMANDS_CONTEXT_ERROR + '\n');
    rl.prompt();
    return;
  }

  if (!consts.SHOW_COMMAND[comd]) {
    agent.handle(module.exports.helpCommand, msg, rl, client);
    return;
  }


  if(comd === 'servers') {
    (async ()=>{
        try{
          let res = await agent.redis_getServers(client);
          let msgOut = {};
          if( res.length > 0 ){
            for( let i=0;i<res.length;i++ ){
                res[i] = agent.redis_getSerKey( res[i] );
            }

            res.sort();
            let sers = await client.mget(res);
            for (let i = sers.length - 1; i >= 0; i--) {
              let server = JSON.parse(sers[i]);
              msgOut[server.id] = {serverInfo : server};
            }
          }
          util.formatOutput(comd, msgOut);
          rl.prompt();

        }catch(err){
          console.log( err );
          rl.prompt();
        }

    })();
    return;
  }
  else if(comd === '-f' || comd === 'force'){
      // let key = client.pomeloConst.prefix + msg.env;
      // let query_args = [key, Date.now(), '+inf'];
      // client.zrangebyscore(query_args, function(err, res) {

      //   if(!!err) {
      //     logger.error('zrangebyscore %j err: %j', query_args, err);
      //     return;
      //   }

      //   for (let i = res.length - 1; i >= 0; i--) {
      //     let server = JSON.parse(res[i]);
      //     let cmd = {command: module.exports.commandId, context: server.id, param: comd};
      //     let key = client.pomeloConst.prefix + msg.env + ':' + server.id;
      //     client.set(key, JSON.stringify(cmd), function(err){
      //       if(!!err) {
      //         util.log('get command with error: %j', err);
      //       }
      //       rl.prompt();
      //       return;
      //     });
      //   }
      // });
      
      return;
  }
  else if(comd === 'connections' || comd === 'proxy' || 
          comd === 'handler' || comd === 'components' || 
          comd === 'settings'|| comd === 'status') 
  {//show all connections of all servers
    (async ()=>{
      try{
        if( Context === 'all' ){
          let cmd = {command: module.exports.commandId, context: Context, param: comd};
          agent.redis_sendCmdMulti(rl,client, true,null,comd,cmd,( resData, info)=>{
            let infoS = JSON.parse(info );
            resData[ infoS.connectionInfo.serverId ] = infoS.connectionInfo;
          });
        }else{
          let cmd = {command: module.exports.commandId, context: Context, param: comd};
          agent.redis_sendCmd(rl,client, true, Context,comd,cmd );
        }
      }catch(err){
        console.log(err);
        rl.prompt();
      }
    })();
    return;
  }
}