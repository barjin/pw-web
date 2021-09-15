/* eslint-disable max-len */
import fs from 'fs';
import path from 'path';

import type { Request, Response } from 'express';

import * as paths from '../Paths';
/**
 * Helper class, encapsulates the REST API related methods (routers, request handlers etc.)
 */
export default class APIHandler {
/**
 * Helper function to encapsulate the data into a JSON object with an "ok header" and send them via HTTP.
 * @param res - Express.js response object.
 * @param data - Data to be sent.
 */
  private sendJSONData = (res, data : unknown) : void => {
    res.json(
      {
        ok: true,
        data,
      },
    );
  };

  /**
 * Helper function to signalize error over HTTP.
 * @param res - Express.js response object.
 * @param reason - Error object describing the error.
 */
  private error = (res, reason:Error) : void => {
    res.json({
      ok: false,
      data: reason.message,
    });
  };

  /**
 * GET request handler for /api/recordings endpoint.
 *
 * Sends list of the paths.savePath folder contents via HTTP (using given response object).
 * @param res - Express.js response object
 */
  private listRecordings = (res) : void => {
    if (!fs.existsSync(paths.savePath)) {
      this.sendJSONData(res, []);
    } else {
      this.sendJSONData(res,
        fs.readdirSync(paths.savePath).map(
          (x, id) => ({
            id,
            name: x,
            createdOn: fs.statSync(path.join(paths.savePath, x)).mtime,
          }),
        ));
    }
  };

  /**
 * GET request handler for /api/recording?id=ID endpoint.
 *
 * Extracts the recording id from the request's query string, parses the ID and tries to return the content over HTTP
 * @param req - Express.js request object
 * @param res - Express.js response object
 */
  private getRecording = (req, res) : void => {
    if (!fs.existsSync(paths.savePath) || fs.readdirSync(paths.savePath).length === 0) {
      this.error(res, new Error('No recordings found!'));
      return;
    }
    if (req.query.id === undefined
|| Number.isNaN(req.query.id)
|| req.query.id < 0
|| req.query.id >= fs.readdirSync(paths.savePath).length) {
      this.error(res, new Error('Invalid ID!'));
      console.log(`${req.query.id} is not a valid recording ID!`);
      return;
    }
    try {
      const filename = fs.readdirSync(paths.savePath)[req.query.id];
      const fileContent : Record<string, unknown> = JSON.parse(fs.readFileSync(
        path.join(paths.savePath, filename),
      ).toString());

      this.sendJSONData(res, { name: filename, actions: fileContent });
    } catch {
      this.error(res, new Error('The requested file is not a valid JSON file'));
    }
  };

  /**
 * Helper function for signalling completion of (or error during) a POST request.
 * @param res - Express.js response object
 * @returns A callback function accepting error object (compliant with the async fs functions callback semantics).
 */
  private postOKCallback(res) {
    return (error) => {
      if (error) {
        this.error(res, error);
      } else {
        res.json({ ok: true });
      }
    };
  }

  /**
 * POST request handler for the /api/renameRecording endpoint.
 *
 * Reads the file id from the "id" field and the desired name from the "newName" field of the request body, tries to rename the file accordingly.
 * @param req - Express.js request object
 * @param res - Express.js response object
 */
  private renameRecording(req, res) {
    try {
      const filename = fs.readdirSync(paths.savePath)[req.body.id];
      if (fs.existsSync(path.join(paths.savePath, req.body.newName))) throw new Error('Name already in use.');
      fs.rename(
        path.join(paths.savePath, filename),
        path.join(paths.savePath, req.body.newName),
        this.postOKCallback(res),
      );
    } catch (e) {
      this.error(res, e);
    }
  }

  /**
 * POST request handler for the /api/deleteRecording endpoint.
 *
 * Reads the file id from the "id" field of the request body, tries to delete the specified file.
 * @param req - Express.js request object
 * @param res - Express.js response object
 */
  private deleteRecording(req, res) {
    try {
      const filename = fs.readdirSync(paths.savePath)[req.body.id];
      if (!fs.existsSync(path.join(paths.savePath, filename))) throw new Error('This file does not exist.');
      fs.unlink(path.join(paths.savePath, filename), this.postOKCallback(res));
    } catch (e) {
      this.error(res, e);
    }
  }

  /**
 * POST request handler for the /api/newRecording endpoint.
 *
 * Reads the file's name from the "name" field of the request body, parses (and somewhat sanitizes) this string and tries to create a new file with this name. Performs several checks (existing file etc.)
 * @param req - Express.js request object
 * @param res - Express.js response object
 */
  private newRecording(req, res) {
    try {
      const filenameSep = (req.body.name).split(/\/|\\/); // simple protection against ../../ paths
      const filename = filenameSep[filenameSep.length - 1];
      if (!fs.existsSync(paths.savePath)) fs.mkdirSync(paths.savePath);
      if (fs.existsSync(path.join(paths.savePath, filename))) throw new Error('Name already in use.');
      fs.writeFile(path.join(paths.savePath, filename), '[]', this.postOKCallback(res));
    } catch (e) {
      this.error(res, e);
    }
  }

  /**
 * POST request handler for the /api/updateRecording endpoint.
 *
 * Reads the file's name from the "name" field and new contents from the "actions" field of the request, and writes this content into the file (overwrites potential existing files).
 * @param req - Express.js request object
 * @param res - Express.js response object
 */
  private updateRecording(req, res) {
    try {
      const filenameSep = (req.body.name).split(/\/|\\/); // simple protection against ../../ paths
      const filename = filenameSep[filenameSep.length - 1];
      fs.writeFile(path.join(paths.savePath, filename), JSON.stringify(req.body.actions), this.postOKCallback(res));
    } catch (e) {
      this.error(res, e);
      console.error(e);
    }
  }

  /**
* GET requests router function.
*
* Reads the request path and routes the request to according functions.
* @param req - Express.js request object
* @param res - Express.js response object
*/
  routeAPIGetRequest = (req : Request, res: Response) : void => {
    console.log(`[REST] GET request at ${req.path}`);

    switch (req.path) {
      case '/api/recordings':
        this.listRecordings(res);
        break;
      case '/api/recording':
        this.getRecording(req, res);
        break;
      default:
        this.error(res, new Error('Invalid action!'));
        break;
    }
  };

  /**
* POST requests router function.
*
* Reads the request path and routes the request to according functions.
* @param req - Express.js request object
* @param res - Express.js response object
*/
  routeAPIPostRequest = (req : Request, res: Response) : void => {
    console.log(`[REST] POST request at ${req.path}`);

    switch (req.path) {
      case '/api/renameRecording':
        this.renameRecording(req, res);
        break;
      case '/api/newRecording':
        this.newRecording(req, res);
        break;
      case '/api/updateRecording':
        this.updateRecording(req, res);
        break;
      case '/api/deleteRecording':
        this.deleteRecording(req, res);
        break;
      default:
        this.error(res, new Error('Invalid action!'));
        break;
    }
  };
}
