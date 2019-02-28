'use strict';

const util = require('../../util');
const consts = require('../../consts');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'run';
module.exports.helpCommand = 'help run';

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

	if(argvs.length < 2){
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	let cmd = {command: module.exports.commandId, context: Context, param: comd};
	agent.redis_sendCmd(rl,client, true, Context,module.exports.commandId,cmd );
}