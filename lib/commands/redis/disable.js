var logger = require('pomelo-logger').getLogger(__filename);
var util = require('../../util');
var consts = require('../../consts');
var cliff = require('cliff');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'disable';
module.exports.helpCommand = 'help disable';

var Command = function(opt) {

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg) {
	if (!comd) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	var Context = agent.getContext();
	if (Context === 'all') {
		util.log('\n' + consts.COMANDS_CONTEXT_ERROR + '\n');
		rl.prompt();
		return;
	}
	
	var argvs = util.argsFilter(argv);

	if (argvs.length > 3) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	var param = argvs[2];
	
	if (comd === 'module') {
		util.log('\n this command will support later\n');
		rl.prompt();
	} else if (comd === 'app') {
		var cmd = {command: module.exports.commandId, context: Context, param: param};
	    var key = consts.REDIS_PREFIX + msg.env + ':' + Context;

		client.set(key, JSON.stringify(cmd), function(err){
			if(!!err) {
				util.log('\ndisable ' + argvs[2] + ' err :%j\n', err);
			}
			util.log('\ndisable ' + argvs[2] + ' success\n');
			rl.prompt();
		});
	} else {
		agent.handle(module.exports.helpCommand, msg, rl, client);
	}
}