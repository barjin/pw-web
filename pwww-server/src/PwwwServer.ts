import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import crypto from 'crypto';
import ws, { Server } from 'ws';

import BrowserSession from './BrowserSession';
import HTTPServer from './http-server/HTTPServer.js';
import logger, {Level} from 'pwww-shared/logger';

/**
 * Main server class, manages browser sessions, runs the HTTP server.
 */
class PWWWServer {
/**
 * Websockets server handling the textual (JSON) commands from the client.
 */
  cmdServer : Server;

  httpPort : number;

  /**
 * List of active sessions, along with their WS connections and tokens.
 */
  sessions : {
    token: string,
    browserSession : BrowserSession|null
  }[] = [];

  /**
 * Helper method to signalize error over given WS connection and close it.
 * @param conn WS connection object
 */
  private static errorAndClose(conn: WebSocket) {
    conn.send(JSON.stringify({ error: true }));
    conn.close();
  }

  /**
 * Constructor for the PWWWServer class
 *
 * Opens WS servers, spawns an instance of HTTPServer.
 *
 * @param messagePort (number) - port for the WS message channels
 * @param httpPort (number) - port for the HTTP server (serves web app and REST API)
 */
  constructor(messagePort: number, httpPort: number) {
    this.cmdServer = new ws.Server({ port: messagePort });
    this.httpPort = httpPort;
  }

  /**
   *
   * Starts the HTTP/Websocket server.
   * Binds the event listeners to the WS connections - handles browser session management,
   * pairs CMD/stream channels using tokens.
   */
  public StartServer() {
    this.cmdServer.on('connection', (conn : WebSocket) => {
      if (this.sessions.length >= (process.env.PWWW_MAX_SESSIONS || 5)) {
        logger('Maximum number of simultaneous sessions reached, forbidding new connection!', Level.WARN);
        PWWWServer.errorAndClose(conn);
      } else {
        const token = crypto.randomBytes(64).toString('hex');
        this.sessions.push({
          token,
          browserSession: new BrowserSession(conn),
        });

        conn.addEventListener('close', () => {
          this.sessions.forEach((session) => {
            if (session.token === token) {
              if(session.browserSession){
                session.browserSession.close();
              }
              else{
                logger('Cannot close BrowserSession, not running!', Level.WARN);
                throw new Error('Cannot close BrowserSession, not running!');
              }
            }
          });

          this.sessions = this.sessions.filter((x) => x.token !== token);
          logger(`[${this.sessions.length}/${process.env.PWWW_MAX_SESSIONS || 5}] Session ${token.substring(0, 7)} closed.`);
        });

        // ERASE THIS!
        conn.addEventListener('message', (ev) => {
          logger(`Incoming message: ${ev.data}`, Level.DEBUG);
        });

        logger(`[${this.sessions.length}/${process.env.PWWW_MAX_SESSIONS || 5}] Session ${token.substring(0, 7)} created.`);
      }
    });

    // this.streamServer.on('connection', (conn : ws) => {
    //   conn.on('message', (message: string) => {
    //     const obj = JSON.parse(message);
    //     if (obj.token) {
    //       const idx = this.sessions.findIndex(
    //         (sess) => (sess.token === obj.token && !(sess.streamConn)),
    //       );

    //       if (idx === -1) {
    //         PWWWServer.errorAndClose(conn);
    //       } else {
    //         const sess = this.sessions[idx];

    //         sess.streamConn = conn;
    //         sess.browserSession = 
    //       }
    //     }
    //   });
    // });

    const httpServer = new HTTPServer();
    httpServer.StartServer(this.httpPort);
  }
}

yargs(hideBin(process.argv)) // eslint-disable-line @typescript-eslint/no-unused-expressions
  .command(['$0', 'start'], 'Starts the PWWW server', (ags) => ags
    .option('messagePort', {
      describe: 'Websockets port for server-client signalling',
      type: 'number',
      default: 8080,
    })
    .option('httpPort', {
      describe: 'HTTP port for serving frontend',
      type: 'number',
      default: 8000,
    }), (argv) => {
    const server = new PWWWServer(argv.messagePort, argv.httpPort);
    server.StartServer();
    
    logger(`Server is running on ports ${argv.messagePort} (WebSockets)...`);
  }).argv;
