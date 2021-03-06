/* eslint-disable max-len */
/*
    CSS selector generator (analyzes given node and tries to create the best fitting selector)
*/

enum CharType {
  VOWEL,
  CONSONANT,
  NONALPHA,
}

/**
 * Calculates probability of the input being a human-readable string (using the Markov chain approach).
 *
 * With an array input, the score is a product of scores of all the array items (gets reduced by a constant coefficient to punish long selectors).
 * @param input String or array of strings to be analyzed.
 * @returns Score on the 0 - 2 scale describing how human-readable the input is (bigger score - more likely to be a readable string)
 */
function MarkovScore(input: (string | string[])) : number {
  if (typeof input === 'object') {
    return (input as any[]).reduce((acc, x) => acc * 0.9 * MarkovScore(x), 1 / 0.9);
  }

  const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
  const consonants = ['b', 'c', 'd', 'f', 'g', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 's', 't', 'v', 'x', 'z', 'h', 'r', 'w'];

  const classifyChar = (char : string) : CharType => {
    if (vowels.includes(char)) {
      return CharType.VOWEL;
    }
    if (consonants.includes(char)) {
      return CharType.CONSONANT;
    }
    return CharType.NONALPHA;
  };

  // DISCLAIMER - ALL the values have been eyeballed and are a result of an educated guess (mainly punishing long sequences of non-alphabetical symbols)
  // The values are already normalized (sequence of alternating vowels and consonants gets score 2 - and most of the "human readable strings" get scores above 1).
  const transitions = [
    [0.9, 1, 0.1], // vowels
    [1, 0.9, 0.1], // consonants
    [0.98, 0.98, 0.04], // non-alpha
  ];

  let score = 1;
  let charType; let
    nextCharType;

  if (input.length === 0) {
    return 0;
  }

  input = input.toLowerCase();
  charType = classifyChar(input[0]);
  for (let i = 0; i < input.length - 1; i += 1) {
    nextCharType = classifyChar(input[i + 1]);
    score *= transitions[charType][nextCharType];
    charType = nextCharType;
  }

  return score * 2;
}

/**
 * Main class for generating Playwright selectors by analyzing the element and its attributes and relations in the DOM tree.
 */
class SelectorGenerator {
  /**
     * Tests if the (CSS) selector targets unique element on the current page.
     * @param selector String with the generated selector
     * @param [root] - if specified, the uniqueness is tested only among this root's direct children.
     * @returns True if unique, false otherwise (the selector targets more than one element).
     */
  private static isUniqueCss(selector : string, root? : ParentNode|null) : boolean {
    if(!root){
      return document.querySelectorAll(selector).length === 1;
    }
    // If we specify the root node, we are looking only at the direct children (css child combinator >).
    return Array.from(root.querySelectorAll(selector))
      .filter((x) => (x.parentNode === root))
      .length === 1;
  }

  /**
     * Grabs the topmost element on the specified coordinates.
     * If the coordinates are not in the current viewport, the page gets scrolled (the document.elementFromPoint would return null for out of screen elements).
     * @param x x click coordinate
     * @param y y click coordinate
     * @returns Topmost element on the specified coordinates.
     */
  static grabElementFromPoint(x: number, y: number) : (Element|null) {
    return document.elementFromPoint(x, y) || (() => {
      window.scrollTo(x, y);
      x -= window.pageXOffset;
      y -= window.pageYOffset;
      return document.elementFromPoint(x, y);
    })();
  }

  /**
     * Generates semantic selector, structural selector and tagname for the element (node).
     * @param element DOM tree node being analysed.
     * @returns Object containing all the available data about the input Node.
     */
  static getNodeInfo(element: Node | null) : { tagName: string, semanticalSelector: string, structuralSelector: string } | { error: string } {
    if (!element) {
      return { error: 'This element is null. Try executing the action again, or use different approach.' };
    }
    if (!(element instanceof HTMLElement)) {
      console.error(`Watch out! Cannot generate selector for ${(element as any).constructor.name}, trying parent...`);
      return this.getNodeInfo(element.parentElement);
    }

    return {
      tagName: (element as Element).tagName,
      semanticalSelector: SelectorGenerator.GetSelectorSemantic(element as HTMLElement),
      structuralSelector: SelectorGenerator.GetSelectorStructural(element),
    };
  }

  /**
     * Generates structural selector (describing element by its DOM tree location).
     * @param element Element being described.
     * @returns CSS-compliant selector describing the element's location in the DOM tree.
     */
   private static GetSelectorStructural(element : Element) : string {
    // Base conditions for the recursive approach.
    if (element.tagName === 'BODY') {
      return 'BODY';
    }
    if (element.id) {
      return `#${element.id}`;
    }

    let selector = element.tagName;
    if (element.parentElement && !SelectorGenerator.isUniqueCss(selector, element.parentNode)) { // if selector is not unique among siblings, we count its position (ugly, but simple)
      {
        const idx = Array.from(element.parentElement.children).findIndex((child) => (child === element));
        selector += `:nth-child(${idx+1})`;
      }
    }
    if(element.parentElement){
      return `${this.GetSelectorStructural(element.parentElement)} > ${selector}`;
    }
    else{
      throw new Error('DOM Tree malformed, orphaned element!');
    }
    
  }

  /*
        Tries to recursively find the best fitting selector for the given element.
        The recursive approach (parent - child chaining) may lead to ugly, long and implementation-specific selectors getting generated.
            Some heuristic might be possible (limiting the number of chained selectors?)
    */
  /**
    * Generates semantical selector (describing element by its attributes and properties).
    * @param element Element being described.
    * @returns Playwright style selector describing the given element based on its properties.
    */
  private static GetSelectorSemantic(element : HTMLElement) : string {
    if (element.tagName === 'BODY') {
      // Base condition for the recursive approach.
      return 'BODY';
    }

    const selector = (() => {
      const shorten = (length:number) => (string: string) => string.substring(0, length);
      // Optional (but very useful) attributes, sorted by usefulness
      // "Condition" describes additional condition (other than sole existence of this attribute on the element),
      //    which needs to be satisfied in order to use this attribute.
      // "Transform" should be a truncating function (using it, the selector equality changes to *=, targetting elements containing values as substrings).
      const attributes :
      {
        attr: RegExp,
        condition?: (element: HTMLElement) => boolean,
        transform?: (attr: string) => string
      }[] = [
        { attr: /^id$/ }, // in CSS, #id === [id=...] ???
        { attr: /^accesskey$/ },
        { attr: /^title$/, transform: shorten(20) },
        { attr: /^alt$/, transform: shorten(20) },
        { attr: /^name$/ },
        { attr: /^placeholder$/ },
        { attr: /^data-/ },
        {
          attr: /^href$/,
          transform: (url: string) : string => {
            // Removes potential long query/fragment strings (is it a good idea?)
            const match = url.match(/^(?<path>(.*?))(?<parameters>([?#].*))?$/);

            if(match && match.groups){
              if (match.groups.parameters && match.groups.parameters.length < 30) {
                return url;
              }
              return match.groups.path;
            }
            return url;
          },
        },
      ];

      const elemAttrs = Array.from(element.attributes);

      for (const attr of attributes) {
        const match = elemAttrs.filter((x) => x.name.match(attr.attr));
        if (match.length) {
          return match.map((x) => {
            if (attr.transform) {
              return `[${x.name}*="${attr.transform(x.value)}"]`;
            }
            return `[${x.name}="${x.value}"]`;
          }).join('');
        }
      }

      if (element.className !== '') {
        /*
          Otherwise we combine all element's classes and hope for the best (is this the best idea?)
          Is it OK to assume that classes are more specific than html tags?
        */
        if (MarkovScore(element.className.split(/\s+/)) > 1) {
          return `.${element.className.split(/\s+/).join('.')}`;
        }
        console.log(`${element.className} did not pass the Markov test!`);
      }
      return null;
    })();

    if (selector) {
      if (SelectorGenerator.isUniqueCss(selector)) { // unique in the whole document
        return selector;
      }
      if (element.parentElement && SelectorGenerator.isUniqueCss(selector, element.parentNode)) { // at least unique among its siblings
        return `${this.GetSelectorSemantic(element.parentElement)} > ${selector}`;
      }
    }

    // the last resort is to describe the element in a "human-readable" form (e.g. GREEN BUTTON with TEXT "Log in")
    //              i.e. tag + class + innerText
    //      Long text content gets truncated (> 30 chars).
    //      Class selector is disabled for now (complicated XPATH translation).
    let innerText = '';
    if (element.innerText !== '') {
      innerText = `:has-text("${
        (element.innerText.length < 30) ? element.innerText : element.innerText.slice(0, 30)
      }")`;
    }

    if(element.parentElement){
      return innerText ? element.tagName + innerText.replace(/([\n\r]|\r\n)/gm, ' ') : `${this.GetSelectorSemantic(element.parentElement)} > ${element.tagName}`;
    }
    throw new Error('DOM Tree malformed, orphaned element!');
    
  }
}

// UNUSED (originally used with the selector generating Tampermonkey script)
// class SelectorHighlighter {
//     private _activeElement : HTMLElement = null;

//     constructor(){
//         return;
//     }

//     private _XPathQuery = (selector : string) : HTMLElement[] => {
//         try{
//             let resultIt : XPathResult = document.evaluate(selector,document);
//             let newItem : Node, out : HTMLElement[] = [];
//             while(newItem = resultIt.iterateNext()){
//                 out.push(newItem as HTMLElement);
//             }
//             return out;
//         }
//         catch(e){
//             console.error("XPATH error!");
//             console.error(e);
//             return [];
//         }
//     }

//     private _CssQuery = (selector : string) : HTMLElement[] => {
//         try{
//             let nodeList = document.querySelectorAll(selector);
//             return Array.from(nodeList) as HTMLElement[];
//         }
//         catch(e){
//             console.error("CSS error!");
//             console.error(e);
//             return [];
//         }
//     }

//     private _evaluateSelector = (selector : string, engine : ("XPATH"|"CSS")) : HTMLElement => {
//         if(engine == "XPATH" || engine == "CSS"){
//             let result = engine == "XPATH" ? this._XPathQuery(selector) : this._CssQuery(selector);
//             // if(result.length !== 1){
//             //     throw result.length > 1 ?
//             //         `${selector} is ambiguous, there are ${result.length} matching elements!`
//             //         : `${selector} - no such elements!`;
//             // }
//             if(result.length === 0){
//                 throw `${selector} - no such elements!`;
//             }
//             return result[result.length - 1];; // If more elements are matched, the last one gets selected (xpath string() concats all descendant text nodes - for a heavily nested element, all "container" elements on the path are found).
//         }
//         else{
//             throw `${engine} - invalid evaluator (use XPATH or CSS)!`;
//         }
//     }
//     /* Converts the simplified playwright selector (only tag + text - PW has special CSS pseudoclasses for text search) into an Xpath selector */
//         /* Issues with chained selectors (parent > child combinator) */
//     private _regMatchToXPath(regMatch : RegExpExecArray) : string {
//         return `//${regMatch.groups.selectors}[contains(normalize-space(string()),normalize-space('${regMatch.groups.text}'))]`;
//     }

//     highlightElement = (selector : string) : void => {
//         const pwSelectorRegex : RegExp = /(?<selectors>.*?):has-text\(\"(?<text>.*?)\"\).*/s;
//         let selectorMatch : RegExpExecArray = pwSelectorRegex.exec(selector);

//         if(selectorMatch){
//             selector = this._regMatchToXPath(selectorMatch);
//         }

//         let element : HTMLElement = this._evaluateSelector(selector, (selectorMatch ? 'XPATH' : 'CSS'));

//         if(this._activeElement !== null){
//             this._activeElement.classList.remove('pwww_selected');
//         }
//         this._activeElement = element;
//         this._activeElement.classList.add('pwww_selected');
//     }
// }

(<Window & { SelectorGenerator: typeof SelectorGenerator }><unknown>window).SelectorGenerator = SelectorGenerator;
// window["SelectorHighlighter"] = SelectorHighlighter;
