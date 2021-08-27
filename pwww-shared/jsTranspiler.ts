import * as types from 'pwww-shared/types';

// Translating only single page recordings at the moment.
// class MockTabManager {
//     tabs = [];
//     currentTab = 0;
// }

/**
 * Escapes double quotes in the given string.
 * @param input String to be escaped
 * @returns String with all the double quotes prepended with a backslash.
 */
function escapeString(input: string) : string{
    return input.replace(/\"/g, "\\\"");
}

/**
 * Base Transpiler class 
 * 
 * Used to generate executable JS code from an array of PWWW actions.
 */
class Transpiler {
    /**
     * Internal screenshot counter for generating unique filenames.
     */
    screenshotID : number = 0;

    /**
     * Header of the generated file stored as a string.
     */
    protected header = 
    `(async () => {
    const {firefox} = require('playwright');
    const fs = require('fs');
    const browser = await firefox.launch({headless: false}); //headful for testing purposes, can be switched
    const page = await browser.newPage();
`;
    
/**
 * Object with BrowserAction types for keys and string generating functions for values.
 * 
 * The functions accept action objects and use the action specific data to generate equivalent code.
 */
    protected actions : {[key : string] : ((data: any) => string)}  = {
        'click' : (data) => `\tawait page.click("${escapeString(data.selector)}");`,
        'browse': (data) => `\tawait page.goto("${escapeString(data.url)}");`,
        'navigate': (data) => `\tawait page.${data.back ? "goBack();" : "goForward();"}`,
        'insertText': (data) => `\tawait page.keyboard.insertText("${data.text}");`,
        'read' : (data) => `
    var elementHandle = await page.waitForSelector("${escapeString(data.selector)}",{timeout: 10000});
    var text = await elementHandle.textContent();
    process.stdout.write(text + "\\n");
`,
        'screenshot' : (data) => {
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
        `    fs.writeFileSync("SCREENSHOT_${this.screenshotID}.png", screenshotBuffer);
        `;
                    this.screenshotID += 1;
                    return codeBuffer;
        }
    }

    /**
     * Ending of the generated file stored as a string.
     */
    protected footer = 
    `
    browser.close();
})();
`;

    /**
     * The main transpiler method, returns transpiled code as a text/plain blob.
     * @param recording Array of action "blocks"
     * @returns The transpiled recording (.js source code) as a text/plain Blob .
     */
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

/**
 * Apify environment specific transpiler
 * 
 * Uses Apify-specific functions and environment variables (mainly) to faciliate storing output data on the Apify platform.
 */
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

    /**
     * Apify Platform specific implementation of the Transpiler.translate() method.
     * 
     * Logs https links to the taken screenshots for easier access.
     * @param recording Recording, array of action blocks
     * @returns The transpiled recording (.js source code) as a text/plain Blob.
     */
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