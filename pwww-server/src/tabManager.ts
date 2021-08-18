const EventEmitter = require('events');
import type { Browser } from '../playwright/src/client/browser';
import type { Page } from '../playwright/src/client/page';

import * as types from 'pwww-shared/types';

class TabManager extends EventEmitter {
    private _browser : Browser;
    private _injections : ({path:string}|Function)[] = [];
    public currentPage : Page;

    constructor(browser : Browser){
        super();
        this._browser = browser;
    }

    private get _pages() : Page[]{
	    return this._browser.contexts()
			.map(context => context.pages())
			.reduce((acc,pages) => [...acc,...pages], [])
    }

    private notifyStateChange() : void{
        this.emit("tabsUpdate", this.listAllTabs());
    }

    private async _pageBootstrapper(page : Page) : Promise<void>{
        page['tabName'] = "Loading...";

        page.on('domcontentloaded', async () => {
            try{
                page['tabName'] = await page.title();
                this.notifyStateChange();
            }
            catch{} // not optimal, just suppressing exceptions (exceptions usually stem from quick navigation, so no biggie, but still.) 
            
        });

        page.on('popup', async (popup: Page) => {
            await this._pageBootstrapper(popup);
        })

        for(let injected of this._injections){
            await page.addInitScript(injected);
        }

        //Reload is needed for the injected scripts to get loaded (will this break anything?)
        await page.reload(); 
    }

    public listAllTabs() : any{
        let currentTab : number = -1;

        for(const [idx, page] of this._pages.entries()){
            if(page === this.currentPage){
                currentTab = idx;
                break;
            }
        }
        
        let tabList = this._pages.map(page => page['tabName']);
        
		return {currentTab: currentTab, tabs: tabList};
	}

    public async recycleContext() : Promise<void> {
        const contexts = this._browser.contexts();
        
        for(let context of contexts){
            await context.close();
        };

        await this.newTab();
    }

	public async newTab(url? : string) : Promise<void>{
        const homeURL = "https://wikipedia.org";

        if(this._browser.contexts().length === 0){
            // For freshly created (or recycled) browser without context
            console.log("Creating new context...");
            await this._browser.newContext({locale: 'en-GB'});
        }


        let currentContext = this._browser.contexts()[this._browser.contexts().length-1];

		this.currentPage = await currentContext.newPage();
        await this._pageBootstrapper(this.currentPage);
		//await this.currentPage.goto(typeof(url) === "string" ? url : homeURL);
	}

    public async closeTab(idx: number) : Promise<void>{
        await this._pages[idx].close();

        if(this.currentPage.isClosed()){
             //If we did not close the last tab, the new focused tab will be the successor of the closed one (otherwise we pick the new last one).
            this.currentPage = this._pages[idx !== this._pages.length ? idx : this._pages.length - 1];    
        }
            
        this.notifyStateChange();
    }

    // The argument is either a JS function or an object with a path to a script (see documentation of Page.addInitScript)
    // Once registered, the injected script survives reloads and navigation.
    public async injectToAll(arg: (Function|{path: string})) : Promise<void>{
        this._injections.push(arg);

        for(let page of this._pages){
            await page.addInitScript(arg);
            await page.reload();
        }
    }

    // switchTabs does not have to be async, since Playwright internally does not 'switch' tabs,
    //  and the switching mechanism is solely user-side.
    public switchTabs(newTab: number) : void{
        this.currentPage = this._pages[newTab];

        this.notifyStateChange();
    }


}

export default TabManager;