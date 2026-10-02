/**
 * The standalone graph page: the graph editor full-window with its toolbar; the address bar holds the graph
 * (#graph=, lz-string).  The same editor runs inside the main CyberChef as its Graph mode (graphMode.mjs).
 *
 * @license Apache-2.0
 */

import { createGraphEditor, graphToLink, graphFromLink } from "./graphEditor.mjs";
import { createGraphToolbar } from "./graphUi.mjs";

window.addEventListener("DOMContentLoaded", () => {
    const linkFor = json => window.location.href.split("#")[0] + "#graph=" + graphToLink(json);
    const editor = createGraphEditor("#graph", {
        onSave: json => window.history.replaceState(null, "", "#graph=" + graphToLink(json))
    });
    createGraphToolbar(document.getElementById("bar"), editor, linkFor);
    const resize = () => editor.resize(window.innerWidth, window.innerHeight - document.getElementById("bar").offsetHeight);
    window.addEventListener("resize", resize);
    resize();
    const m = window.location.hash.match(/graph=([^&]+)/);
    let json = null;
    if (m) {
        try {
            json = graphFromLink(m[1]);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Could not read the graph in the link", e);
        }
    }
    window.puzzlesGraph = Object.assign({}, editor, {ready: editor.load(json)});
});
