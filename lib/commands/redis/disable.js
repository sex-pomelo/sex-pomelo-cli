'use strict';

const util = require('../../util');
const consts = require('../../consts');


module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'disable';
module.exports.helpCommand = 'help disable';

let Command = function(opt) {

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg) {
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

	if (argvs.length > 3) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	let param = argvs[2];
	
	if (comd === 'module') {
		util.log('\n this command will support later\n');
		rl.prompt();
	} else if (comd === 'app') {
		let cmd = {command: module.exports.commandId, context: Context, param: param};
		agent.redis_sendCmd(rl,client, false, Context,module.exports.commandId,cmd );
	} else {
		agent.handle(module.exports.helpCommand, msg, rl, client);
	}
}