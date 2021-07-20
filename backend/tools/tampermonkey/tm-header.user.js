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
