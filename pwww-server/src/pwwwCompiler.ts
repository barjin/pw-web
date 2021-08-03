const fs = require('fs');

import * as types from 'pwww-shared/types';

// Translating only single page recordings at the moment.
// class MockTabManager {
//     tabs = [];
//     currentTab = 0;
// }

function escapeString(input: string) : string{
    return input.replace(/\"/g, "\\\"");
}

let filename : string = process.argv[2]; //yargs?
const recording : types.BrowserState["recording"]["recording"] = JSON.parse(fs.readFileSync(filename).toString());

//does it exist? etc etc, this is dangerous
let translatedFile = fs.createWriteStream(`${filename}.tr.js`, {
    flags: 'a' // 'a' means appending (old data will be preserved)
});
  
["(async () => {\nconst {chromium} = require('playwright');",
"const browser = await chromium.launch({headless: false});", //for testing purposes
"const page = await browser.newPage();\n"].reduce((acc,x) => {translatedFile.write(`${x}\n`); return acc},"");


const actions = {
    'click' : (data) => `await page.click("${escapeString(data.selector)}");`,
    'browse': (data) => `await page.goto("${escapeString(data.url)}")`,
    'navigate': (data) => `await page.${data.back ? "goBack();" : "goForward();"}`
}

for(let action of recording){
    if(action.what.type in actions){
        translatedFile.write(`${actions[action.what.type](action.what.data)}\n`);
        translatedFile.write("await page.waitForLoadState();\n\n");
    }
}
translatedFile.write("})();")
translatedFile.end();
