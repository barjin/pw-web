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
    protected header = 
    `(async () => {
    const {firefox} = require('playwright');
    const browser = await firefox.launch({headless: false}); //headful for testing purposes, can be switched
    const page = await browser.newPage();
`;
    
    protected actions : {[key : string] : ((data: any) => string)}  = {
        'click' : (data) => `\tawait page.click("${escapeString(data.selector)}");`,
        'browse': (data) => `\tawait page.goto("${escapeString(data.url)}");`,
        'navigate': (data) => `\tawait page.${data.back ? "goBack();" : "goForward();"}`,
        'insertText': (data) => `\tawait page.keyboard.insertText("${data.text}");`,
        'read' : (data) => `
    var elementHandle = await page.waitForSelector("${escapeString(data.selector)}",{timeout: 10000});
    var text = await elementHandle.textContent();
    process.stdout.write(text + "\\n");
`
    }

    protected footer = 
    `
    browser.close();
})();
`;

    public translate(recording: types.Action[]) : Blob{
        let translationBuffer = [this.header];
        
        for(let action of recording){
            if(action.type in this.actions){
                translationBuffer.push(`${(this.actions as any)[action.type](action.data)}\n`);
                translationBuffer.push("\tawait page.waitForLoadState();\n");
            }
        }
        translationBuffer.push(this.footer);
        
        return new Blob(translationBuffer,{
            type: "text/plain;charset=utf-8"
        });
    }
}
class ApifyTranspiler extends Transpiler {
    screenshotID : number = 0;

    constructor(){
        super();

        this.header = 
`const Apify = require('apify');
const { log } = Apify.utils;
const { APIFY_DEFAULT_KEY_VALUE_STORE_ID } = process.env;
Apify.main(async () => {
    const browser = await Apify.launchPlaywright();
    const page = await browser.newPage();
`;
        
        Object.keys(this.actions).map(key => {
            let old : Function = this.actions[key];
            this.actions[key] = (data : any) => (
`    log.info("Executing ${key}");    
    ${old(data)}
`)});

        this.actions["read"] = (data : any) =>
`    var elementHandle = await page.waitForSelector("${escapeString(data.selector)}");
     var text = await elementHandle.innerText();
     await Apify.pushData({data:text});
`

        this.actions["screenshot"] = (data : any) => {
        //Before taking any kind of screenshot, we want to make sure the images/styles/DOM are all loaded.
        let codeBuffer = 
`     await page.waitForLoadState('networkidle');
`
        codeBuffer += data.selector ?
`    var elementHandle = await page.waitForSelector("${escapeString(data.selector)}");
    var screenshotBuffer = await elementHandle.screenshot();
`:
`    var screenshotBuffer = await page.screenshot({ fullPage: true });
`
            codeBuffer += 
`    await Apify.setValue("SCREENSHOT_${this.screenshotID}", screenshotBuffer, { contentType: 'image/png' });
`;
            this.screenshotID += 1;
            return codeBuffer;
        }

this.footer = `
    await page.close();
    await browser.close();

    log.info("Built with PWWW <3");
});`
    }

    translate(recording: types.Action[]) : Blob{
        if(recording.filter(x => x.type as any === types.BrowserAction[types.BrowserAction.screenshot]).length){
            this.footer = 
`    log.info("Beep boop, your screenshots are available here:");
    const keyValueStore = await Apify.openKeyValueStore();
    await keyValueStore.forEachKey(async (key, index, info) => {
        if(key.includes("SCREENSHOT")){
            log.info(\`https://api.apify.com/v2/key-value-stores/\${APIFY_DEFAULT_KEY_VALUE_STORE_ID}/records/\${key}?disableRedirect=true\`);
        }
    });` + this.footer;
        }
        return super.translate(recording);
    }
    
}

export {ApifyTranspiler, Transpiler};