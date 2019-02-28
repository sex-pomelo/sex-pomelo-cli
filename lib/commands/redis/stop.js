'use strict';

const util = require('../../util');
const consts = require('../../consts');
const countDownLatch = require('../../countDownLatch');


module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'stop';
module.exports.helpCommand = 'help stop';

let Command = function(opt) {

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg) {
	if (!comd) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	let argvs = util.argsFilter(argv);
	let ids = argvs.slice(1);
	let cmd = {command: module.exports.commandId};
	let fails = [];

	rl.question(consts.STOP_QUESTION_INFO, function(answer) {
		if (answer === 'yes') {
			if(comd == 'all') {
				agent.redis_sendCmdMulti(rl,client, false,null,comd,cmd );
			}else if(comd.indexOf('serverType=') != -1) {
				let type = comd.split('=')[1];
				agent.redis_sendCmdMulti(rl,client, false,type,comd,cmd );
			} else {
				let latch = countDownLatch.createCountDownLatch(ids.length, {timeout: 10 * 1000}, function() {
					if(!fails.length) {
						console.log('server: %s has been stopped.', ids.join(','));
					} else {
						console.log('stop failed with servers: %j', fails);
					}
					rl.prompt();
				});
				for(let j=0; j<ids.length; j++) {
					(function(index) {
						let setKey = agent.redis_getCmdKey(ids[j]);
						client.set(setKey, JSON.stringify(cmd), function(err){
							if(err){
								console.log('set stop %j, err: %j', setKey, err.stack);
								fails.push(ids[index]);
							}
							latch.done();
						});

					})(j)
				}
			}
		}
	});
}