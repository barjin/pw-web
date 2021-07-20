let selectorHighlighter = new SelectorHighlighter();
let selectorGenerator = new SelectorGenerator();

document.addEventListener('click', (ev) => 
{
    var element = document.elementFromPoint(ev.clientX, ev.clientY);
    let selector = selectorGenerator.GetSelector(element);

    console.log(selector);
    selectorHighlighter.highlightElement(selector);
},true); //capture option set to true - the listener above will be called before the event is handed down to the actual target (and their action is executed)