import * as types from 'pwww-shared/types'

const api_url = "http://localhost:8000/api/"
// Returns thenable with js object with response
export function postAPI(endpoint : string, body : object) : Promise<types.APIResponse<object>> {
    return fetch(api_url + endpoint, {
        method: 'POST',
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
    }).then(x => x.json());
}

export function getAPI(endpoint: string) : Promise<types.APIResponse<object>>{
    return fetch(api_url + endpoint, {
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    }).then(x => x.json());
}