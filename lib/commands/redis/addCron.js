'use strict';

const util = require('../../util');
const consts = require('../../consts');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'addCron';
module.exports.helpCommand = 'help addCron';

let Command = function(opt) {

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg) {
	if (!comd) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	let args = util.argsFilter(argv).slice(1);
	let cron_arg = {};
	let cmd = {command: module.exports.commandId, cron: cron_arg};
	let serverId;
	let serverType;

	rl.question(consts.ADDCRON_QUESTION_INFO, function(answer) {
		if (answer === 'yes') {
			let flag = false;
			args.forEach(function(item) {
				if(util.startsWith(item, 'serverId')) {
					serverId = item.split('=')[1];
					flag = true;
				}
				if(util.startsWith(item, 'serverType')) {
					serverType = item.split('=')[1];
				}

				if(util.startsWith(item, 'id')) {
					let id = item.split('=')[1];
					cron_arg.id = id;
				}
				if(util.startsWith(item, 'time')) {
					let time = item.split('=')[1];
					cron_arg.time = time;
				}
				if(util.startsWith(item, 'action')) {
					let action = item.split('=')[1];
					cron_arg.action = action;
				}
			});

			if(flag) {
				agent.redis_sendCmd(rl,client, false, serverId,module.exports.commandId,cmd );
			}else {
				(async ()=>{
				  try{
					let serIds = await agent.redis_getServers( client,serverType );
					let serCmds = {};
					for(let i=0;i<serIds.length; i++ ){
						let serCmdKey = agent.redis_getCmdKey( serIds[i] );
						cmd.context = serIds[i];
						serCmds[ serCmdKey ] = JSON.stringify(cmd);
					}

					await client.mset( serCmds );

					console.log("addCron OK!");
					rl.prompt();
				  }catch(err){
					console.log( err );
					rl.prompt();
				  }
				})();
			}
		} else {
			rl.prompt();
		}
	});
}