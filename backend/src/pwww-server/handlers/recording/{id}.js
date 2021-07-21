'use strict';
var dataProvider = require('../../data/recording/{id}.js');
/**
 * Operations on /recording/{id}
 */
module.exports = {
    /**
     * summary: 
     * description: Returns recording in JSON Format
     * parameters: id
     * produces: 
     * responses: 200
     */
    get: function getRecording(req, res, next) {
        /**
         * Get the data for response 200
         * For response `default` status 200 is used.
         */
        var status = 200;
        var provider = dataProvider['get']['200'];
        provider(req, res, function (err, data) {
            if (err) {
                next(err);
                return;
            }
            res.status(status).send(data && data.responses);
        });
    }
};
