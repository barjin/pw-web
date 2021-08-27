import * as types from 'pwww-shared/types'

const api_url = process.env.NODE_ENV === 'production' ? '/api/' : "http://localhost:8000/api/";

/**
 * Helper function for simplifying the POST REST API requests.
 * @param {string} endpoint - API endpoint (only the "updateRecording", "newRecording" etc. part - i.e. without the hostname nor /api)
 * @param {object} body - Serializable object to be used as the POST request body
 * @returns The promise gets resolved with the incoming object after the response arrival. If the response is {ok: false}, the promise gets rejected (throws).
 */
export function postAPI(endpoint : string, body : object) : Promise<types.APIResponse<object>> {
    return fetch(api_url + endpoint, {
        method: 'POST',
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
    }).then(x => x.json())
    .then(obj => {
        if(!obj.ok) throw obj.data;
        return obj;
    });
}

/**
 * Helper function for simplifying the POST GET API requests.
 * @param {string} endpoint - API endpoint (only the "updateRecording", "newRecording" etc. part - i.e. without the hostname nor /api)
 * @returns The promise gets resolved with the incoming object after the response arrival. If the response is {ok: false}, the promise gets rejected (throws).
 */
export function getAPI(endpoint: string) : Promise<types.APIResponse<object>>{
    return fetch(api_url + endpoint, {
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    }).then(x => x.json())
    .then(obj => {
        if(!obj.ok) throw obj.data;
        return obj;
    });
}