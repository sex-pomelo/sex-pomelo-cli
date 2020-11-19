
let util = require('../util');
let consts = require('../consts');
let cliff = require('clifflite');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'help';

let Command = function(opt){

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg){
	if (!comd) {
		util.errorHandle(argv, rl);
		return;
	}

	let argvs = util.argsFilter(argv);

	if (argvs.length > 2) {
		util.errorHandle(argv, rl);
		return;
	}

	if (comd === 'help') {
		help();
		rl.prompt();
		return;
	}

	if (consts.COMANDS_MAP[comd]) {
		let INFOS = consts.COMANDS_MAP[comd];
		for (let i = 0; i < INFOS.length; i++) {
			util.log(INFOS[i]);
		}
		rl.prompt();
		return;
	}

	util.errorHandle(argv, rl);
}

let help = function() {
	let HELP_INFO_1 = consts.HELP_INFO_1;
	for (let i = 0; i < HELP_INFO_1.length; i++) {
		util.log(HELP_INFO_1[i]);
	}

	let COMANDS_ALL = consts.COMANDS_ALL;
	util.log(cliff.stringifyRows(COMANDS_ALL));

	let HELP_INFO_2 = consts.HELP_INFO_2;
	for (let i = 0; i < HELP_INFO_2.length; i++) {
		util.log(HELP_INFO_2[i]);
	}
}