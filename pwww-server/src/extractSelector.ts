/*
    CSS selector generator (analyzes given node and tries to create the best fitting selector)
*/

enum CharType {
    VOWEL,
    CONSONANT,
    NONALPHA
}

function MarkovScore(string: string) : number {
    const vowels = ['a','e','i','o','u','y'];
    const consonants = ['b','c','d','f','g','j','k','l','m','n','p','q','s','t','v','x','z','h','r','w'];

    const classifyChar = (char : string) : CharType => {
        if(vowels.includes(char)){
            return CharType.VOWEL;
        }
        else if(consonants.includes(char)){
            return CharType.CONSONANT;
        }
        return CharType.NONALPHA;
    }

    //DISCLAIMER - ALL the values have been eyeballed and are a result of an educated guess (mainly punishing long sequences of non-alphabetical symbols)
    const transitions = [   
        [0.45,0.50,0.05], //vowels
        [0.50,0.45,0.05],  //consonants
        [0.49,0.49,0.02] //non-alpha
    ];

    let score = 1;
    let charType, nextCharType;
    
    if(string.length === 0){
        return 0;
    }

    string = string.toLowerCase();
    charType = classifyChar(string[0]);
    for(let i = 0; i < string.length-1; i++){
        nextCharType = classifyChar(string[i+1]);
        score *= transitions[charType][nextCharType];
        charType = nextCharType
    }
    
    return score*Math.pow(2,string.length);
}

/* Calculates (Euclidean Distance)^2 between two vectors */
function EuclideanDistanceSq(vecA: number[], vecB: number[]) : number{
    if(vecA.length !== vecB.length){
        throw "Vectors of different size!";
    }
    return vecA.reduce((acc,x,id) => (acc + (x - vecB[id]) * (x - vecB[id])), 0);
}
// /*
//     Tries to determine whether `input` is a human-readable string or a procedurally generated nonsense.
// */
// function readabilityScore(input : string) : number {
//     var input = input.toLowerCase();

//     let vowelCount = input.match(/[a|e|i|o|u|y]/g)?.length || 0;
//     let consonantCount = input.match(/[b|c|d|f|g|j|k|l|m|n|p|q|s|t|v|x|z|h|r|w]/g)?.length || 0;

//     let restCount = input.length - vowelCount - consonantCount;

//     // Might possibly break (for example) for consonant-heavy languages.
//     const standard_distribution = [0.3,0.6,0.1];
//     const current_distibution = [vowelCount/input.length, consonantCount/input.length, restCount/input.length];

//     console.log(current_distibution);
//     /* 
//         The distribution vectors are Manhattan-normalized (the coordintates sum up to 1).
//         The biggest (Euclidean) distance between two points on the Mathattan unit sphere is 2 (from one vertex of the "sphere"-cube to the opposite).
//         This function returns normalized, "inversed" distance - the higher the score, the better.
//         Euclidean distance is probably not necessary, Manhattan metric would work just as well (though threshold for meaningful scripts would be different).
//     */
//     return 1-(EuclideanDistanceSq(standard_distribution, current_distibution))/2;
// }

class SelectorGenerator{
    private _isUniqueCss(selector : string, root : ParentNode = document) : boolean{
        if(root === document){
            return root.querySelectorAll(selector).length === 1;
        }
        // If we specify the root node, we are looking only at the direct children (css child combinator >).
        return Array.from(root.querySelectorAll(selector))
                .filter((x) => (x.parentNode === root))
                .length === 1;
    }

    /*
        Tries to recursively find the best fitting selector for the given element.
        The recursive approach (parent - child chaining) may lead to ugly, long and implementation-specific selectors getting generated.
            Some heuristic might be possible (limiting the number of chained selectors?)
    */
    GetSelector(element : HTMLElement) : string{
        if(!(element instanceof HTMLElement)){
            console.error(`Cannot generate selector for ${(element as any).constructor.name}`);
            return "";
        }

        if(element.tagName === "BODY"){
            // Base condition for the recursive approach.
            return "BODY";
        }

        // Optional (but very useful) attributes, sorted by usefulness
        const attributes = [
            "id",   //in CSS, #id === [id=...] ???
            "href",
            "accesskey",
            "title"
        ]
    
        for(let attr of attributes){
            if(element.getAttribute(attr) !== null){
                return `[${attr}="${element.getAttribute(attr)}"]`;
            }
        }

        if (element.className !== ""){
            /* 
                Otherwise we combine all element's classes and hope for the best (is this the best idea?)
                Is it OK to assume that classes are more specific than html tags?
            */
            let classCombinedSelector = '.'+element.className.split(/\s+/).join('.');
            if(this._isUniqueCss(classCombinedSelector)){   // unique in the whole document
                return classCombinedSelector;
            }
            else if(this._isUniqueCss(classCombinedSelector, element.parentNode)){  // at least unique among its siblings
                return this.GetSelector(element.parentElement) + " > " + classCombinedSelector;
            }
        }
        
        // the last resort is to describe the element in a "human-readable" form (e.g. GREEN BUTTON with TEXT "Log in")
        //              i.e. tag + class + innerText
        //      Long text content gets truncated (> 30 chars).
        //      Class selector is disabled for now (complicated XPATH translation). 
        let innerText = "";
        if(element.innerText !== ""){
            innerText = ":has-text(\"" + 
                ((element.innerText.length < 30) ? element.innerText : element.innerText.slice(0,30))
            + "\")"
        }

        return element.tagName + innerText.replace(/([\n\r]|\r\n)/gm, " ");
    }
}


class SelectorHighlighter {
    private _activeElement : HTMLElement = null;

    constructor(){
        return;
    }

    private _XPathQuery = (selector : string) : HTMLElement[] => {
        try{
            let resultIt : XPathResult = document.evaluate(selector,document);
            let newItem : Node, out : HTMLElement[] = [];
            while(newItem = resultIt.iterateNext()){
                out.push(newItem as HTMLElement);
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
            // if(result.length !== 1){
            //     throw result.length > 1 ? 
            //         `${selector} is ambiguous, there are ${result.length} matching elements!`
            //         : `${selector} - no such elements!`;
            // }
            if(result.length === 0){
                throw `${selector} - no such elements!`;
            }
            return result[result.length - 1];; // If more elements are matched, the last one gets selected (xpath string() concats all descendant text nodes - for a heavily nested element, all "container" elements on the path are found).
        }
        else{
            throw `${engine} - invalid evaluator (use XPATH or CSS)!`;
        }
    }
    /* Converts the simplified playwright selector (only tag + text - PW has special CSS pseudoclasses for text search) into an Xpath selector */
        /* Issues with chained selectors (parent > child combinator) */
    private _regMatchToXPath(regMatch : RegExpExecArray) : string {
        return `//${regMatch.groups.selectors}[contains(normalize-space(string()),normalize-space('${regMatch.groups.text}'))]`;
    }

    highlightElement = (selector : string) : void => {
        const pwSelectorRegex : RegExp = /(?<selectors>.*?):has-text\(\"(?<text>.*?)\"\).*/s;
        let selectorMatch : RegExpExecArray = pwSelectorRegex.exec(selector);

        if(selectorMatch){
            selector = this._regMatchToXPath(selectorMatch);
        }
        
        let element : HTMLElement = this._evaluateSelector(selector, (selectorMatch ? 'XPATH' : 'CSS'));

        if(this._activeElement !== null){
            this._activeElement.classList.remove('pwww_selected');
        }
        this._activeElement = element;
        this._activeElement.classList.add('pwww_selected');
    }
}

window["SelectorGenerator"] = SelectorGenerator;
window["SelectorHighlighter"] = SelectorHighlighter;