const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')

import WSChannel from './wsChannel';
import BrowserSession from './browserSession';
import HTTPServer from './http-server/server_v2.js';
import crypto from 'crypto';

import ws, { Server, ServerOptions } from 'ws';

class PWWWServer {
	cmdServer : Server;
	streamServer: Server;

	sessions : {
		cmdConn : ws, 
		streamConn: ws, 
		token: string,
		browserSession : BrowserSession
	}[] = [];

	private errorAndClose(conn: ws){
		conn.send(JSON.stringify({"error":true}));
		conn.close();
	}

	constructor(messagePort, streamPort, httpPort){
		this.cmdServer = new ws.Server({port: messagePort});
		this.streamServer = new ws.Server({port: streamPort});

		this.cmdServer.on('connection', (conn : ws) => {
			if(this.sessions.length >= (process.env["PWWW_MAX_SESSIONS"] || 5)){
				console.warn(`Maximum number of simultaneous sessions reached, forbidding new connection!`);
				this.errorAndClose(conn);
			}
			else{
				let token = crypto.randomBytes(64).toString('hex');
				this.sessions.push({
					cmdConn : conn,
					streamConn: null,
					token: token,
					browserSession: null
				});

				conn.on('close',() => {
					this.sessions = this.sessions.filter((x) => x.token !== token);
					console.log(`[${this.sessions.length}/${process.env["PWWW_MAX_SESSIONS"] || 5}] Session ${token.substring(0,7)} closed.`);
				});

				console.log(`[${this.sessions.length}/${process.env["PWWW_MAX_SESSIONS"] || 5}] Session ${token.substring(0,7)} created.`);
				conn.send(JSON.stringify({token: token}));
			}
		});

		this.streamServer.on('connection', (conn : ws) => {
			conn.on('message', (message: string) => {
				let obj = JSON.parse(message);
				if(obj.token){
					for(let sess of this.sessions){
						if(sess.token === obj.token && !(sess.streamConn)){
							sess.streamConn = conn;
							if(!sess.browserSession){
								sess.browserSession = new BrowserSession(sess.cmdConn, sess.streamConn);
							}
							return;
						}
					}
					this.errorAndClose(conn);
				}
			})
		});

		let httpServer = new HTTPServer();

		httpServer.StartServer(httpPort);
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
	  .option('httpPort', {
		describe: 'HTTP port for serving frontend',
		type: 'number',
		default: 8000
	  })
  }, (argv) => {
    const server = new PWWWServer(argv.messagePort, argv.streamPort, argv.httpPort);
	console.log(`Server is running on ports ${argv.messagePort}, ${argv.streamPort} (WebSockets)...
Frontend available at http://localhost:${argv.httpPort}`);
  }).argv;