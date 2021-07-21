'use strict';
var dataProvider = require('../data/recordings.js');
/**
 * Operations on /recordings
 */
module.exports = {
    /**
     * summary: 
     * description: Returns names of all saved recordings
     * parameters: 
     * produces: 
     * responses: 200
     */
    get: function getAllRecordings(req, res, next) {
        /**
         * Get the data for response 200
         * For response `default` status 200 is used.
         */
        var status = 200;
        var provider = dataProvider['get']['200'];
        res.header('Access-Control-Allow-Origin' , '*' );
        provider(req, res);
    }
};
