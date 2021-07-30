// ==UserScript==
// @name         PWWW Selector Generator (+Highlighter)
// @namespace    https://github.com/barjin/pw-web
// @version      0.1
// @description  Demo of selector generator for PWWW (https://github.com/barjin/pw-web)
// @author       barjin (Jindřich Bär)
// @match        *://*/*
// @icon         https://playwright.dev/img/playwright-logo.svg
// @updateURL    https://raw.githubusercontent.com/barjin/pw-web/development/backend/tools/tampermonkey/tm_script.user.js
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle('.pwww_selected { background-color: pink !important }');
class SelectorGenerator {
    constructor() {
        return;
    }
    _isUniqueCss(selector, root = document) {
        if (root === document) {
            return root.querySelectorAll(selector).length === 1;
        }
        return Array.from(root.querySelectorAll(selector))
            .filter((x) => (x.parentNode === root))
            .length === 1;
    }
    GetSelector(element) {
        if (!(element instanceof HTMLElement)) {
            console.error(`Cannot generate selector for ${element.constructor.name}`);
            return "";
        }
        if (element.tagName === "BODY") {
            return "BODY";
        }
        if (element.id !== "") {
            return "#" + element.id;
        }
        else if (element.className !== "") {
            let classCombinedSelector = '.' + element.className.split(/\s+/).join('.');
            if (this._isUniqueCss(classCombinedSelector)) {
                return classCombinedSelector;
            }
            else if (this._isUniqueCss(classCombinedSelector, element.parentNode)) {
                return this.GetSelector(element.parentElement) + " > " + classCombinedSelector;
            }
        }
        let innerText = "";
        if (element.innerText !== "") {
            innerText = ":text(\"" +
                ((element.innerText.length < 30) ? element.innerText : element.innerText.slice(0, 30))
                + "\")";
        }
        return element.tagName + innerText;
    }
}
class SelectorHighlighter {
    constructor() {
        this._activeElement = null;
        this._XPathQuery = (selector) => {
            try {
                let resultIt = document.evaluate(selector, document);
                let newItem, out = [];
                while (newItem = resultIt.iterateNext()) {
                    out.push(newItem);
                }
                return out;
            }
            catch (e) {
                console.error("XPATH error!");
                console.error(e);
                return [];
            }
        };
        this._CssQuery = (selector) => {
            try {
                let nodeList = document.querySelectorAll(selector);
                return Array.from(nodeList);
            }
            catch (e) {
                console.error("CSS error!");
                console.error(e);
                return [];
            }
        };
        this._evaluateSelector = (selector, engine) => {
            if (engine == "XPATH" || engine == "CSS") {
                let result = engine == "XPATH" ? this._XPathQuery(selector) : this._CssQuery(selector);
                if (result.length === 0) {
                    throw `${selector} - no such elements!`;
                }
                return result[result.length - 1];
                ;
            }
            else {
                throw `${engine} - invalid evaluator (use XPATH or CSS)!`;
            }
        };
        this.highlightElement = (selector) => {
            const pwSelectorRegex = /(?<selectors>.*?):text\(\"(?<text>.*?)\"\).*/s;
            let selectorMatch = pwSelectorRegex.exec(selector);
            if (selectorMatch) {
                selector = this._regMatchToXPath(selectorMatch);
            }
            let element = this._evaluateSelector(selector, (selectorMatch ? 'XPATH' : 'CSS'));
            if (this._activeElement !== null) {
                this._activeElement.classList.remove('pwww_selected');
            }
            this._activeElement = element;
            this._activeElement.classList.add('pwww_selected');
        };
        return;
    }
    _regMatchToXPath(regMatch) {
        return `//${regMatch.groups.selectors}[contains(normalize-space(string()),normalize-space('${regMatch.groups.text}'))]`;
    }
}

(function() {
'use strict';

let selectorHighlighter = new SelectorHighlighter();
let selectorGenerator = new SelectorGenerator();

document.addEventListener('click', (ev) => 
{
    var element = document.elementFromPoint(ev.clientX, ev.clientY);
    let selector = selectorGenerator.GetSelector(element);

    console.log(selector);
    selectorHighlighter.highlightElement(selector);
},true); //capture option set to true - the listener above will be called before the event is handed down to the actual target (and their action is executed)
})();
