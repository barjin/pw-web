import { Buffer } from 'buffer';
const url = require('url');
const https = require('https');
const fs = require('fs');
const path = require('path');

const exec = require('child_process').exec;

const zipName = "pwww-bundle.zip";
console.log = (message) => {process.stdout.write(`[updater] ${message}\n`)}

class RequestMaker {
    static GET_OPTIONS = {
      hostname: 'api.github.com',
      port: 443,
      method: 'GET',
      headers:{
        "User-Agent": "pwww-updater"
      }
    }
  
    static makeRequest = (options) : Promise<Buffer> => {
      return new Promise((resolve,reject) => {
        const req = https.request(
          {...RequestMaker.GET_OPTIONS, ...options}, 
          res => {
              let buffer = [];
      
              res.on('data', (d) => {
                  buffer.push(d);
              });
      
              res.on('end', () => {
                  resolve(Buffer.concat(buffer));
              });
           })
      
            req.on('error', error => {
              console.error(error);
              reject(error);
            })
            
            req.end();
      });
    }
}

async function main(){

  console.log("Checking for updates...");
  await RequestMaker.makeRequest({path: '/repos/barjin/pw-web/actions/artifacts'})
    .then((buffer : Buffer) => {
      let listing = JSON.parse(buffer.toString());
      let latestArtifact = listing['artifacts'][0];

      fs.stat(path.join(__dirname, zipName), (error,stats) => {
        if(error || new Date(stats.mtime) < new Date(latestArtifact["updated_at"])){
          console.log(`Downloading the latest version of pwww (artifact id ${latestArtifact.id}).`);

          // nightly.link itself does not always serve the newest artifact, therefore checking through Github REST API
          const downloadURL = `https://nightly.link/barjin/pw-web/actions/artifacts/${latestArtifact.id}.zip`;

          // child_process.exec is probably not the cleanest solution, but very simple (requires wget and unzip, but that's fine with Docker)
          exec(`wget -O ${zipName} ${downloadURL}`, ()=>{});
          process.exitCode = 1; // terrible, downloading new version is not an error... but whatever :)
        }
        else{
          console.log("You are already running the latest version of Pwww (or you messed with the files, then it's on you :) )");
        }
      })
    })
    .catch((e) => {
      console.log(`Something went wrong :( ${e}`);
    });
}

main();