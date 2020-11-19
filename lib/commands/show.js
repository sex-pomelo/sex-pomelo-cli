
let util = require('../util');
let consts = require('../consts');

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
	
	client.request('watchServer', {
		comd: comd,
		param: param,
		context: Context
	}, function(err, data) {
		if (err) console.log(err);
		else util.formatOutput(comd, data);
		rl.prompt();
	});
}