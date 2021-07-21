'use strict';
/**
 * Operations on /recordings
 */

const fs = require('fs');
const path = require('path');
const paths = require('../../paths');

module.exports = {
    /**
     * summary: 
     * description: Returns names of all saved recordings
     * parameters: 
     * produces: 
     * responses: 200
     * operationId: getAllRecordings
     */
    get: {
        200: function (req, res) {
            if(!fs.existsSync(fs.realpathSync(paths.savePath))){
                res.json(fs.realpathSync(paths.savePath));
            }
            else{
                res.json(
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
    }
};
