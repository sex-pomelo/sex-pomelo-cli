'use strict';

const util = require('./util');
const fs = require('fs');

let Command = function() {
	this.redis_commands = {};
	this.init();
	this.Context = 'all';
	this.redisCfg = 'development';
}

module.exports = function(){
	return new Command();
}

Command.prototype.setEnv = function( redisCfg ){
	this.redisCfg = redisCfg;
}



Command.prototype.init = function() {
	let self = this;
	fs.readdirSync(__dirname + '/commands/redis').forEach(function(filename) {
		if (/\.js$/.test(filename)) {
			let name = filename.substr(0, filename.lastIndexOf('.'));
			let _command = require('./commands/redis/' + name);
			self.redis_commands[name] = _command;
		}
	});
}


Command.prototype.redis_getServers = async function( client,serverType,frontsend )
{
	let key = this.redisCfg.prefix + this.redisCfg.env;
  let query_args = [key, Date.now(), '+inf'];
	let res = await client.zrangebyscore(query_args);
	
	if( serverType !== undefined && serverType !== null ){
		let resT = [];
		for(let i=0;i<res.length; i++ ){
			if( res[i].indexOf(serverType) !== -1 ){
				resT.push( res[i] );
			}
		}

		return resT;
	}

	if( frontsend !== undefined && frontsend !== null){
		let frontStr = (frontsend===true)?"true":"false"; 
		let resT = [];
		for( let i=0;i<res.length;i++ ){
				res[i] = this.redis_getSerKey( res[i] );
		}

		res.sort();
		let sers = await client.mget(res);
		for (let i = sers.length - 1; i >= 0; i--) {
			let server = JSON.parse(sers[i]);
			if( server.frontend == frontStr ){
				resT.push( server.id );
			}
		}

		return resT;
	}

	return res;
}

Command.prototype.redis_getSerKey = function( serID ){
	return this.redisCfg.serPrefix + this.redisCfg.env + ":" + serID;
}

Command.prototype.redis_getCmdKey = function( serID ){
	return this.redisCfg.prefix + this.redisCfg.env + ":" + serID;
}

Command.prototype.redis_getCmdResKey = function( serID ){
	return this.redisCfg.resPrefix + this.redisCfg.env + ":" + serID;
}

function sex_timeout(ms) {
	return new Promise((resolve) => {
	  setTimeout(resolve, ms);
	});
}

function array_uniquelize( srArr){  
	let ra = [];  
	for(let i = 0; i < srArr.length; i ++){  
			if(!ra.includes(srArr[i])){  
				ra.push(srArr[i]);  
			}  
	}  
	return ra;  
};

function array_intersection(a, b) {
let result = [];
for(let i = 0; i < b.length; i ++) {
		let temp = b[i];
		for(let j = 0; j < a.length; j ++) {
				if(temp === a[j]) {
						result.push(temp);
						break;
				}
		}
}
return array_uniquelize(result);
}

Command.prototype.redis_sendCmd = function( rl,redis, hasRet, context, commandId,cmd )
{
	(async ()=>{
		try{
			let key = this.redis_getCmdKey( context );
			await redis.set( key, JSON.stringify(cmd) );
			// wait server get cmd
			let checkCnt = 0;
			let serHasGetCmd = false;
			while(1){
				await sex_timeout( 1000 );
				console.log(`wait ${context} get cmd ... [${10-checkCnt}]s`);
				let exists = await redis.exists( key );
				if( !exists ){
					serHasGetCmd = true;
					break;
				}
				checkCnt += 1;
				if(checkCnt >= 10){
				  break;
				}
			}

			if( serHasGetCmd === false ){
				console.log(`${context} don't get cmd,timeout`);
				rl.prompt();
				return;
			}
			console.log(`${context} has get cmd.`);

			if( hasRet ){
				checkCnt = 0;
				serHasGetCmd = false;
				key = this.redis_getCmdResKey(context);

				while(1){
					await sex_timeout( 1000 );
					console.log(`wait ${context} run cmd ... [${10-checkCnt}]s`);

					let res = await redis.get(key);
					if(!!res){
						util.formatOutput(commandId, res);
						await redis.del( key );
						serHasGetCmd = true;
						break;
					}
					checkCnt += 1;
					if(checkCnt >= 10){
					  break;
					}
				}

				if( serHasGetCmd === false ){
					console.log(`${context} run cmd,timeout`);
				}
			}

			rl.prompt();
		}catch( err){
			console.log(err);
			rl.prompt();
		}
	})();
}

Command.prototype.redis_sendCmdMulti = function( rl,redis,hasRet, serverType, commandId,cmd,cb )
{
	(async ()=>{
		try{
			let serIds = [];
			if( typeof(serverType) === 'boolean' ){
				serIds = await this.redis_getServers( redis,null,serverType );
			}else{
				serIds = await this.redis_getServers( redis,serverType );
			}
			
			if( serIds.length === 0 ){
				console.log("no server exists!");
				rl.prompt();
				return;
			}

			let serCmds = {};
			let resKeys = [];
			for( let i=0;i<serIds.length;i++ ){
				let serCmdKey = this.redis_getCmdKey( serIds[i] );
				let serCmdResKey = this.redis_getCmdResKey( serIds[i] );
				cmd.context = serIds[i];
				serCmds[ serCmdKey ] = JSON.stringify(cmd);
				resKeys.push( serCmdResKey );
			}

			await redis.mset( serCmds );
			let tip = serIds.join(",");
			console.log(`server ${tip} has set cmd: ${cmd.command}`);
			////////
			if( hasRet){
				let checkCnt = 0;
				let resInfos = [];
				let resDatas = {};
				while(1){
					await sex_timeout( 1000 );
					console.log(`wait runCmd ${ cmd.command} ... [${checkCnt}]s`);
					resInfos = await redis.mget( resKeys );
					let allGet = true;
					let resKeysTmp = [];
					for( let i=0;i<resInfos.length; i++ ){
							if( resInfos[i] !== null){
								if( typeof(cb) === 'function' ){
									cb( resDatas, resInfos[i] );
								}
								await redis.del( resKeys[i] );
								//console.log(`i ${resKeys[i]} now return ok.`);
							}else{
								allGet = false;
								resKeysTmp.push(resKeys[i]);
							}
					}

					resKeys = resKeysTmp;
					if( allGet ){
						break;
					}
					checkCnt += 1;
					if(checkCnt >= 30){
						break;
					}
				}

				if( checkCnt >= 30 ){
					for( let i=0;i<resInfos.length; i++ ){
							if( resInfos[i] === null){
									console.log(`x ${resKeys[i]} run Cmd err.`);
							}
					}
				}              

				////////////////////
				util.formatOutput(commandId,resDatas );
			}

			rl.prompt();
		}catch( err){
			console.log(err);
			rl.prompt();
		}
	})();
}



Command.prototype.handle = function(argv, msg, rl, client){
	let self = this;
	let argvs = util.argsFilter(argv);
	let comd = argvs[0];
	let comd1 = argvs[1] || "";

	comd1 = comd1.trim();
	let m = this.redis_commands[comd];

	if(m){
		let _command = m();
		_command.handle(self, comd1, argv, rl, client, msg);
	} else {
		util.errorHandle(argv, rl);
	}
}

Command.prototype.quit = function(rl){
	rl.emit('close');
}

Command.prototype.getContext = function(){
	return this.Context;
}

Command.prototype.setContext = function(context){
	this.Context = context;
}
