let consts = require('./consts');
let util = require('./util');
let cliff = require('cliff');
let fs = require('fs');

let Command = function() {
	this.commands = {};
	this.init();
	this.Context = 'all';
}

module.exports = function(){
	return new Command();
}

Command.prototype.init = function() {
	let self = this;
	fs.readdirSync(__dirname + '/commands').forEach(function(filename) {
		if (/\.js$/.test(filename)) {
			let name = filename.substr(0, filename.lastIndexOf('.'));
			let _command = require('./commands/' + name);
			self.commands[name] = _command;
		}
	});
}

Command.prototype.handle = function(argv, msg, rl, client){
	let self = this;
	let argvs = util.argsFilter(argv);
	let comd = argvs[0];
	let comd1 = argvs[1] || "";

	comd1 = comd1.trim();
	let m = this.commands[comd];
	if(m){
		let _command = m();
		_command.handle(self, comd1, argv, rl, client, msg);
	} else {
		util.errorHandle(argv, rl);
	}
}

Command.prototype.quit = function(rl){
	rl.emit('close');
}

Command.prototype.kill = function(rl, client){
	rl.question(consts.KILL_QUESTION_INFO, function(answer){
		if(answer === 'yes'){
			client.request(consts.CONSOLE_MODULE, {
				signal: "kill"
			}, function(err, data) {
				if (err) console.log(err);
				rl.prompt();
			});
		} else {
			rl.prompt();
		}
	});
}

Command.prototype.getContext = function(){
	return this.Context;
}

Command.prototype.setContext = function(context){
	this.Context = context;
}
