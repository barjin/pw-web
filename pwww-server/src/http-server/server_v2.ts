import fs from 'fs';
import path from 'path';
import * as paths from '../paths';
import cors from 'cors';

/**
 * Helper class, encapsulates the REST API related methods (routers, request handlers etc.)
 */
class APIHandler {
    constructor(){};

    /**
     * Helper function to encapsulate the data into a JSON object with an "ok header" and send them via HTTP.
     * @param res - Express.js response object.
     * @param data - Data to be sent.
     */
    private _sendJSONData = (res, data : object) : void => {
        res.json(
            {
                ok: true,
                data: data
            }
        );
    }

    /**
     * Helper function to signalize error over HTTP.
     * @param res - Express.js response object.
     * @param reason - Serializable data (preferably string) describing the error.
     */
    private _error = (res, reason) : void => {
        res.json({
            ok: false,
            data: reason
        });
    }

    /**
     * GET request handler for /api/recordings endpoint.
     * 
     * Sends list of the paths.savePath folder contents via HTTP (using given response object).
     * @param res - Express.js response object
     */
    private _listRecordings = (res) : void => {
        if(!fs.existsSync(paths.savePath)){
            this._sendJSONData(res,[]);
        }
        else{
            this._sendJSONData(res,
                fs.readdirSync(paths.savePath).map(
                    (x,id) => ({
                        id: id,
                        name: x,
                        createdOn: fs.statSync(path.join(paths.savePath, x)).mtime
                    })
                )
            );
        }
    }

    /**
     * GET request handler for /api/recording?id=ID endpoint.
     * 
     * Extracts the recording id from the request's query string, parses the ID and tries to return the content over HTTP
     * @param req - Express.js request object
     * @param res - Express.js response object
     */
    private _getRecording = (req, res) : void => {
        if(!fs.existsSync(paths.savePath) || fs.readdirSync(paths.savePath).length === 0){
            this._error(res, "No recordings found!");
            return;
        }
        else if(req.query.id === undefined 
            || isNaN(req.query.id)
            || req.query.id < 0 
            || req.query.id >= fs.readdirSync(paths.savePath).length){
                this._error(res, "Invalid ID!");
                console.log(`${req.query.id} is not a valid recording ID!`);
                return;
        }

        try{
            let filename = fs.readdirSync(paths.savePath)[req.query.id];
            let fileContent : object = 
            JSON.parse(fs.readFileSync(
                path.join(paths.savePath,filename)
            ).toString());

            this._sendJSONData(res, {name: filename, actions: fileContent});
        }
        catch{
            this._error(res,"The requested file is not a valid JSON file");
        }
    }

    /**
     * Helper function for signalling completion of (or error during) a POST request.
     * @param res - Express.js response object
     * @returns A callback function accepting error object (compliant with the async fs functions callback semantics).
     */
    private _postOKCallback(res){
        return (error) => {
            if(error){
                this._error(res,error);
            }
            else{
                res.json({ok:true});
            }
        }
    }

    /**
     * POST request handler for the /api/renameRecording endpoint.
     * 
     * Reads the file id from the "id" field and the desired name from the "newName" field of the request body, tries to rename the file accordingly.
     * @param req - Express.js request object
     * @param res - Express.js response object
     */
    private _renameRecording(req, res){
        try{
            let filename = fs.readdirSync(paths.savePath)[req.body.id];
            if(fs.existsSync(path.join(paths.savePath, req.body.newName))) throw "Name already in use.";
            fs.rename(
                path.join(paths.savePath,filename), 
                path.join(paths.savePath, req.body.newName), 
                this._postOKCallback(res));
        }
        catch(e){
            this._error(res,e);
        }
    }

    /**
     * POST request handler for the /api/deleteRecording endpoint.
     * 
     * Reads the file id from the "id" field of the request body, tries to delete the specified file.
     * @param req - Express.js request object
     * @param res - Express.js response object
     */
    private _deleteRecording(req, res){
        try{
            let filename = fs.readdirSync(paths.savePath)[req.body.id];
            if(!fs.existsSync(path.join(paths.savePath, filename))) throw "This file does not exist.";
            fs.unlink(path.join(paths.savePath,filename), this._postOKCallback(res));
        }
        catch(e){
            this._error(res,e);
        }
    }

    /**
     * POST request handler for the /api/newRecording endpoint.
     * 
     * Reads the file's name from the "name" field of the request body, parses (and somewhat sanitizes) this string and tries to create a new file with this name. Performs several checks (existing file etc.)
     * @param req - Express.js request object
     * @param res - Express.js response object
     */
    private _newRecording(req, res){
        try{
            let filenameSep = (req.body.name).split(/\/|\\/); // simple protection against ../../ paths
            let filename = filenameSep[filenameSep.length-1];
            if(!fs.existsSync(paths.savePath)) fs.mkdirSync(paths.savePath);
            if(fs.existsSync(path.join(paths.savePath, filename))) throw "Name already in use.";
            fs.writeFile(path.join(paths.savePath, filename), "[]", this._postOKCallback(res));
        }
        catch(e){
            this._error(res,e);
        }
    }

    /**
     * POST request handler for the /api/updateRecording endpoint.
     * 
     * Reads the file's name from the "name" field and new contents from the "actions" field of the request, and writes this content into the file (overwrites potential existing files).
     * @param req - Express.js request object
     * @param res - Express.js response object
     */
    private _updateRecording(req, res){
        try{
            let filenameSep = (req.body.name).split(/\/|\\/); // simple protection against ../../ paths
            let filename = filenameSep[filenameSep.length-1];
            fs.writeFile(path.join(paths.savePath, filename), JSON.stringify(req.body.actions), this._postOKCallback(res));
        }
        catch(e){
            this._error(res,e);
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
    routeAPIGetRequest = (req, res) => {
        console.log(`[REST] GET request at ${req.path}`)

        switch (req.path) {
            case '/api/recordings':
                this._listRecordings(res);        
                break;
            case '/api/recording':
                this._getRecording(req, res);
                break;
            default:
                this._error(res,"Invalid action!");      
                break;
        }
    }

    /**
     * POST requests router function.
     * 
     * Reads the request path and routes the request to according functions.
     * @param req - Express.js request object
     * @param res - Express.js response object
     */
    routeAPIPostRequest = (req, res) => {
        console.log(`[REST] POST request at ${req.path}`)

        switch (req.path) {
            case '/api/renameRecording':
                this._renameRecording(req, res);        
                break;
            case '/api/newRecording':
                this._newRecording(req, res);        
                break;
            case '/api/updateRecording':
                this._updateRecording(req, res);        
                break;
            case '/api/deleteRecording':
                this._deleteRecording(req, res);
                break;
            default:
                this._error(res,"Invalid action!");      
                break;
        }
    }
}

/**
 * Base HTTP server object 
 */
class HTTPServer {
    /**
     * API Handler object handling REST API requests.
     */
    private _apiHandler : APIHandler;

    /**
     * Start function for the Express.js HTTP server.
     * @param port - Port to start the Express.js HTTP server at.
    */
    StartServer(port : number = 8000) : void{
        const express = require('express');
        const app = express();
        this._apiHandler = new APIHandler();

        app.use(cors())
        app.use(express.json())
        app.get('/api*', this._apiHandler.routeAPIGetRequest);
        app.post('/api*', this._apiHandler.routeAPIPostRequest);

        
        app.use('/static/',express.static(path.join(paths.wwwPath, "static")));
        app.get(/^.*\/static\/(.*)$/, (req,res)=> res.redirect("/static/" + req.params[0]));

        app.get(['/','/recording'], (_,res) => {res.sendFile(path.join(paths.wwwPath,"index.html"))});

        app.listen(port, () => {
            console.log(`HTTP sever listening at http://localhost:${port}`)
        });
    }
}

export {HTTPServer};