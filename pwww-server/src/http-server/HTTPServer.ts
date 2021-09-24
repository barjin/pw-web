import express from 'express';
import cors from 'cors';

import path from 'path';
import APIHandler from './APIHandler';
import * as paths from '../Paths';

import {Server} from 'ws';

/**
 * Base HTTP server object
 */
export default class HTTPServer {
  /**
     * API Handler object handling REST API requests.
     */
  private apiHandler : APIHandler;
  private wsHandler: Server;

  constructor(wsServer: Server){
    this.wsHandler = wsServer;
    this.apiHandler = new APIHandler();
  }

  /**
     * Start function for the Express.js HTTP server.
     * @param port - Port to start the Express.js HTTP server at.
    */
  StartServer(port = 8000) : void {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.get('/api*', this.apiHandler.routeAPIGetRequest);
    app.post('/api*', this.apiHandler.routeAPIPostRequest);

    app.use('/static/', express.static(path.join(paths.wwwPath, 'static')));
    app.get(/^.*\/static\/(.*)$/, (req, res) => res.redirect(`/static/${req.params[0]}`));

    app.get(['/', '/recording'], (_, res) => { res.sendFile(path.join(paths.wwwPath, 'index.html')); });

    const server = app.listen(port);

    server.on("upgrade", ((request: any, socket: any, head: any) => {
      this.wsHandler.handleUpgrade(request, socket, head, (websocket) => {
          this.wsHandler.emit("connection", websocket, request);
      });
    }) as any);
  }
}
