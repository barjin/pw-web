const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')

import WSChannel from './wsChannel';
import PlaywrightWrapper from './playwright_wrapper';

class Server{
	browser : PlaywrightWrapper;

	constructor(messagePort, streamPort){
		let messagingChannel = new WSChannel(messagePort);
		let streamChannel = new WSChannel(streamPort);
		this.browser = new PlaywrightWrapper(messagingChannel, streamChannel);
	}
}

yargs(hideBin(process.argv))
  .command(['$0','start'], 'Starts the PWWW server', (yargs) => {
    return yargs
      .option('messagePort', {
        describe: 'Websockets port for server-client signalling',
		type: 'number',
        default: 8080
      })
	  .option('streamPort', {
		describe: 'Websockets port for browser screencast streaming',
		type: 'number',
		default: 8081
	  })
  }, (argv) => {
    const server = new Server(argv.messagePort, argv.streamPort);
	console.log(`Server is running on ports ${argv.messagePort}, ${argv.streamPort}...`);
  }).argv;