import * as types from 'pwww-shared/types';

// Translating only single page recordings at the moment.
// class MockTabManager {
//     tabs = [];
//     currentTab = 0;
// }

function escapeString(input: string) : string{
    return input.replace(/\"/g, "\\\"");
}

// let filename : string = process.argv[2]; //yargs?
// const recording : types.BrowserState["recording"]["recording"] = JSON.parse(fs.readFileSync(filename).toString());

// //does it exist? etc etc, this is dangerous
// let translatedFile = fs.createWriteStream(`${filename}.tr.js`, {
//     flags: 'a' // 'a' means appending (old data will be preserved)
// });
  

class Transpiler {
    private headers : string[] = 
    ["(async () => {\nconst {chromium} = require('playwright');\n",
    "const browser = await chromium.launch({headless: false});\n", //for testing purposes
    "const page = await browser.newPage()\n",
    "await page.goto('https://wikipedia.org')\n\n"];
    
    public translate(recording: types.RecordedAction[]) : Blob{
        const actions = {
            'click' : (data: any) => `await page.click("${escapeString(data.selector)}");`,
            'browse': (data: any) => `await page.goto("${escapeString(data.url)}");`,
            'navigate': (data: any) => `await page.${data.back ? "goBack();" : "goForward();"}`,
            'insertText': (data: any) => `await page.keyboard.insertText("${data.text}");`
        }

        let translationBuffer = [...this.headers];
        
        for(let action of recording){
            if(action.what.type in actions){
                translationBuffer.push(`${(actions as any)[action.what.type](action.what.data)}\n`);
                translationBuffer.push("await page.waitForLoadState();\n\n");
            }
        }
        translationBuffer.push("})();")
        
        return new Blob(translationBuffer,{
            type: "text/plain;charset=utf-8"
        });
    }
}

export {Transpiler};