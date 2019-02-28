'use strict';

const util = require('../../util');
const consts = require('../../consts');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'blacklist';
module.exports.helpCommand = 'help blacklist';

let Command = function(opt) {

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg) {
	if (!comd) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}
	let args = util.argsFilter(argv).slice(1);
	let cmd = {command: module.exports.commandId, blacklist: args};

	rl.question(consts.BLACKLIST_QUESTION_INFO, function(answer) {
		if (answer === 'yes') {

			(async ()=>{
			  try{
				  console.log( msg );
				let sers = await agent.redis_getServers( client, null,true);
				console.log(sers);

				//////////
				let serCmds = {};
				for(let i=0;i<sers.length; i++ ){
					let serCmdKey = agent.redis_getCmdKey( sers[i] );
					cmd.context = sers[i];
					serCmds[ serCmdKey ] = JSON.stringify(cmd);
				}

				await client.mset( serCmds );
  
				console.log("add blacklist ok!");

				rl.prompt();
			  }catch(err){
				console.log( err );
				rl.prompt();
			  }
			})();
		} else {
			rl.prompt();
		}
	});
}