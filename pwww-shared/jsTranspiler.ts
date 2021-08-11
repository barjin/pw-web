import * as types from 'pwww-shared/types';

// Translating only single page recordings at the moment.
// class MockTabManager {
//     tabs = [];
//     currentTab = 0;
// }

function escapeString(input: string) : string{
    return input.replace(/\"/g, "\\\"");
}

class Transpiler {
    private headers : string[] = 
    ["(async () => {\nconst {firefox} = require('playwright');\n",
    "const browser = await firefox.launch({headless: false});\n", //for testing purposes
    "const page = await browser.newPage()\n\n"];
    
    public translate(recording: types.Action[]) : Blob{
        const actions = {
            'click' : (data: any) => `await page.click("${escapeString(data.selector)}");`,
            'browse': (data: any) => `await page.goto("${escapeString(data.url)}");`,
            'navigate': (data: any) => `await page.${data.back ? "goBack();" : "goForward();"}`,
            'insertText': (data: any) => `await page.keyboard.insertText("${data.text}");`,
            'read' : (data : any) => `
const elementHandle = await page.$("${escapeString(data.selector)}");
var text = await elementHandle.textContent();
process.stdout.write(text + "\\n");
            `
        }

        let translationBuffer = [...this.headers];
        
        for(let action of recording){
            if(action.type in actions){
                translationBuffer.push(`${(actions as any)[action.type](action.data)}\n`);
                translationBuffer.push("await page.waitForLoadState('networkidle');\n\n");
            }
        }
        translationBuffer.push("})();")
        
        return new Blob(translationBuffer,{
            type: "text/plain;charset=utf-8"
        });
    }
}

export {Transpiler};