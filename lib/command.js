let consts = require('./consts');
let util = require('./util');
let fs = require('fs');


class Command {
	constructor() {
		this.commands = {};
		this.init();
		this.Context = 'all';
	}

	init () {
		let self = this;
		fs.readdirSync(__dirname + '/commands').forEach(function(filename) {
			if (/\.js$/.test(filename)) {
				let name = filename.substr(0, filename.lastIndexOf('.'));
				let _command = require('./commands/' + name);
				self.commands[name] = _command;
			}
		});
	}
	
	handle (argv, msg, rl, client){
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
	
	quit(rl){
		rl.emit('close');
	}
	
	kill(rl, client){
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
	
	getContext(){
		return this.Context;
	}
	
	setContext(context){
		this.Context = context;
	}
}


module.exports = function(){
	return new Command();
}


