import fs from 'fs';
import path from 'path';
import * as paths from '../paths';
import cors from 'cors';

class APIHandler {
    constructor(){};

    private _sendJSONData = (res, data : object) : void => {
        res.json(
            {
                ok: true,
                data: data
            }
        );
    }

    private _error = (res, reason) : void => {
        res.json({
            ok: false,
            data: reason
        });
    }

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

            this._sendJSONData(res, {name: filename, recording: fileContent});
        }
        catch{
            this._error(res,"The requested file is not a valid JSON file");
        }
    }

    private _renameRecording(req, res){
        try{
            let filename = fs.readdirSync(paths.savePath)[req.body.id];
            if(fs.existsSync(path.join(paths.savePath, req.body.newName))) throw "Name already in use.";
            fs.rename(path.join(paths.savePath,filename), path.join(paths.savePath  ,req.body.newName), ()=>{res.json({ok:true})});
        }
        catch(e){
            this._error(res,e);
        }
    }

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

    
    routeAPIPostRequest = (req, res) => {
        console.log(`[REST] POST request at ${req.path}`)

        switch (req.path) {
            case '/api/renameRecording':
                this._renameRecording(req, res);        
                break;
            default:
                this._error(res,"Invalid action!");      
                break;
        }
    }


}

class HTTPServer {
    private _apiHandler : APIHandler;

    StartServer(port : number = 3000) : void{
        const express = require('express');
        const app = express();
        this._apiHandler = new APIHandler();

        app.use(cors())
        app.use(express.json())
        app.get('/api*', this._apiHandler.routeAPIGetRequest);
        app.post('/api*', this._apiHandler.routeAPIPostRequest);

        app.use('/', express.static('www'));

        app.listen(port, () => {
            console.log(`Example app listening at http://localhost:${port}`)
        });
    }
}

export default HTTPServer;