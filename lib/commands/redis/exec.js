'use strict';

const util = require('../../util');
const consts = require('../../consts');
const fs = require('fs');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'exec';
module.exports.helpCommand = 'help exec';

let Command = function(opt){

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg){
	if (!comd) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	let Context = agent.getContext();
	if (Context === 'all') {
		util.log('\n' + consts.COMANDS_CONTEXT_ERROR + '\n');
		rl.prompt();
		return;
	}

	let argvs = util.argsFilter(argv);

	if(argvs.length >2){
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	let file = null;
	if(comd[0] !== '/'){
		comd = process.cwd() + '/' + comd;
	}

	try{
		file = fs.readFileSync(comd).toString();
	}catch(e){
		util.log(consts.COMANDS_EXEC_ERROR);
		rl.prompt();
		return;
	}

	let cmd = {command: module.exports.commandId, serverId: Context, script: file};
	agent.redis_sendCmd(rl,client, true, Context,module.exports.commandId,cmd );
}
