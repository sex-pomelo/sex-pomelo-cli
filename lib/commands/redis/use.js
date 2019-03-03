'use strict';

const util = require('../../util');
const consts = require('../../consts');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'use';
module.exports.helpCommand = 'help use';

let Command = function(opt) {

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg) {
	if (!comd) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	let Context = agent.getContext();
	let argvs = util.argsFilter(argv);

	if (argvs.length > 2) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	if (comd === 'all') {
		util.log('\nswitch to context: ' + comd + '\n');
		Context = comd;
		agent.setContext(Context);
		let PROMPT = msg['env'] + " : " + Context + '>';
		rl.setPrompt(PROMPT);
		rl.prompt();
		return;
	}

	(async ()=>{
		try{
			let res = await agent.redis_getServers( client );
			if(res.length === 0) {
				console.log('no server exist');
			}else{
			   let hasFind = false;
			   for(let i=0; i<res.length; i++) {
				  let serverId = res[i];
				  if(serverId === comd){
					  util.log('\nswitch to server context: ' + comd + '\n');
					  Context = comd;
					  agent.setContext(Context);
					  let PROMPT = msg['env'] + " : " + Context + '>';
					  rl.setPrompt(PROMPT);
					  hasFind = true;
					  break;
				  }
			  }

			  if( hasFind === false ){
				  console.log(`server ${comd} not exist!`);
			  }
		  }

		  rl.prompt();
		}catch( err ){
			console.log( err );
			rl.prompt();
		}
	})();
}