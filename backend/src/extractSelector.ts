/*
    CSS selector generator (analyzes given node and tries to create the best fitting selector)
*/

/*
    Tries to recursively find the best fitting selector for the given element.
    The recursive approach (parent - child chaining) may lead to ugly, long and implementation-specific selectors getting generated.
        Some heuristic might be possible (limiting the number of chained selectors?)
*/
function GetSelector(element : HTMLElement) : string{
    if(element.tagName === "HTML"){
        // Base condition for the recursive approach.
        return "HTML";
    }

    function isUniqueCss(selector : string, root : ParentNode = document) : boolean{
        if(root === document){
            return root.querySelectorAll(selector).length === 1;
        }
        // If we specify the root node, we are looking only at the direct children (css child combinator >).
        return Array.from(root.querySelectorAll(selector))
                .filter((x) => (x.parentNode === root))
                .length === 1;
    }

    if(element.id !== ""){
        //The best possible outcome, ids should be unique, therefore targetting one specific element.
        return "#"+element.id;
    }
    else if (element.className !== ""){ 
        /* 
        Otherwise we combine all element's classes and hope for the best (is this the best idea?)
        Is it OK to assume that classes are more specific than html tags?
        */
        let classCombinedSelector = '.'+element.className.split(/\s+/).join('.');
        if(isUniqueCss(classCombinedSelector)){
            return classCombinedSelector;
        }
        else if(isUniqueCss(classCombinedSelector, element.parentNode)){
            return GetSelector(element.parentElement) + " > " + classCombinedSelector;
        }
    }

    if(isUniqueCss(element.tagName, element.parentNode)){
        return GetSelector(element.parentElement) + " > " + element.tagName;
    }

    // Element's text content is the last resort, but is it really that unreliable?
    if(element.innerText !== ""){
        return "text=" + element.innerText; 
    }

    return "invalid!";
}

class SelectorHighlighter {
    private _activeElement : HTMLElement = null;

    private _XPathQuery = (selector : string) : HTMLElement[] => {
        try{
            let resultIt = document.evaluate(selector,document);
            let out = [];
            while(resultIt){
                out.push(resultIt.iterateNext());
            }
            return out;
        }
        catch(e){
            console.error("XPATH error!");
            console.error(e);
            return [];
        }       
    }

    private _CssQuery = (selector : string) : HTMLElement[] => {
        try{
            let nodeList = document.querySelectorAll(selector);
            return Array.from(nodeList) as HTMLElement[];
        }
        catch(e){
            console.error("CSS error!");
            console.error(e);
            return [];
        }       
    }

    private _evaluateSelector = (selector : string, engine : ("XPATH"|"CSS")) : HTMLElement => {
        if(engine == "XPATH" || engine == "CSS"){
            let result = engine == "XPATH" ? this._XPathQuery(selector) : this._CssQuery(selector);
            if(result.length !== 1){
                throw result.length > 1 ? 
                    `${selector} is ambiguous, there are ${result.length} matching elements!` 
                    : `${selector} - no such elements!`;
            }
            return result[0];
        }
        else{
            throw `${engine} - invalid evaluator (use XPATH or CSS)!`;
        }
    }

    constructor(){
        return;
    }

    highlightElement = (selector : string) : void => {
        let element = this._evaluateSelector(selector,'CSS');

        if(this._activeElement !== null){
            this._activeElement.classList.remove('selected');
        }
        this._activeElement = element;
        this._activeElement.classList.add('selected');
    }
}