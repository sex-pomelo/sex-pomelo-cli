'use strict';

const util = require('../../util');
const consts = require('../../consts');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'enable';
module.exports.helpCommand = 'help enable';

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
		// client.command(module.exports.commandId, param, null, function(err, data) {
		// 	if (err) console.log(err);
		// 	else {
		// 		if(data === 1){
		// 			util.log('\ncommand ' + argv + ' ok\n');
		// 		}	else {
		// 			util.log('\ncommand ' + argv + ' bad\n');
		// 		}
		// 	}
		// 	rl.prompt();
		// });
		util.log('\n this command will support later\n');
		rl.prompt();
	} else if (comd === 'app') {
		let cmd = {command: module.exports.commandId, context: Context, param: param};
		agent.redis_sendCmd(rl,client, false, Context,module.exports.commandId,cmd );
	} else {
		agent.handle(module.exports.helpCommand, msg, rl, client);
	}
}