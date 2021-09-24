"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var buffer_1 = require("buffer");
var url = require('url');
var https = require('https');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var zipName = "pwww-bundle.zip";
console.log = function (message) { process.stdout.write("[updater] " + message + "\n"); };
var RequestMaker = /** @class */ (function () {
    function RequestMaker() {
    }
    RequestMaker.GET_OPTIONS = {
        hostname: 'api.github.com',
        port: 443,
        method: 'GET',
        headers: {
            "User-Agent": "pwww-updater"
        }
    };
    RequestMaker.makeRequest = function (options) {
        return new Promise(function (resolve, reject) {
            var req = https.request(__assign(__assign({}, RequestMaker.GET_OPTIONS), options), function (res) {
                var buffer = [];
                res.on('data', function (d) {
                    buffer.push(d);
                });
                res.on('end', function () {
                    resolve(buffer_1.Buffer.concat(buffer));
                });
            });
            req.on('error', function (error) {
                console.error(error);
                reject(error);
            });
            req.end();
        });
    };
    return RequestMaker;
}());
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Checking for updates...");
                    return [4 /*yield*/, RequestMaker.makeRequest({ path: '/repos/barjin/pw-web/actions/artifacts' })
                            .then(function (buffer) {
                            var listing = JSON.parse(buffer.toString());
                            if (listing['artifacts']) {
                                var latestArtifact = listing['artifacts'][0];
                            }
                            else {
                                // if the artifacts field is missing from the JSON response, there should be at least an error message (might happen e.g. due to the API rate limits)
                                throw listing['message'];
                                process.exitCode = 2;
                            }
                            fs.stat(path.join(__dirname, zipName), function (error, stats) {
                                if (error || new Date(stats.mtime) < new Date(latestArtifact["updated_at"])) {
                                    console.log("Downloading the latest version of pwww (artifact id " + latestArtifact.id + ").");
                                    // nightly.link itself does not always serve the newest artifact, therefore checking through Github REST API
                                    var downloadURL = "https://nightly.link/barjin/pw-web/actions/artifacts/" + latestArtifact.id + ".zip";
                                    // child_process.exec is probably not the cleanest solution, but very simple (requires wget and unzip, but that's fine with the currently used Docker Alpine image)
                                    exec("wget -O " + zipName + " " + downloadURL, function () { });
                                    process.exitCode = 1; // terrible, downloading new version is not an error... but whatever :)
                                }
                                else {
                                    console.log("You are already running the latest version of Pwww (or you messed with the files, then it's on you :) )");
                                }
                            });
                        })["catch"](function (e) {
                            console.log("An unexpected error occured :( " + e);
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main();
