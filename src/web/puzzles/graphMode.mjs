/**
 * Graph mode inside the main CyberChef: a Recipe / Graph switch in the banner.  In Graph mode the recipe, input and
 * output panes give way to the graph editor (the operations list stays, and double-clicking an operation adds it as a
 * node); in Recipe mode everything is as CyberChef has it.  The two hold DIFFERENT states - a DAG is not a linear
 * recipe - and switching never converts one into the other: the linear recipe and input keep their usual URL and
 * storage, the graph is kept in the browser (localStorage "puzzles.graph") and in its own link (#graph=).  A link with
 * #graph= opens in Graph mode; otherwise the last mode used is restored.
 *
 * @license Apache-2.0
 */

import { createGraphEditor, graphToLink, graphFromLink } from "./graphEditor.mjs";
import { createGraphToolbar } from "./graphUi.mjs";

const MODE_KEY = "puzzles.editorMode", GRAPH_KEY = "puzzles.graph";

/* the link as it was opened: CyberChef rewrites the address bar while it starts, so a #graph= link is read here, when
   this module loads, before the app does */
const OPENED_HASH = window.location.hash;

/** run once the CyberChef app has built its panes */
function whenAppReady(fn) {
    const t = setInterval(() => {
        if (window.app && window.app.manager && document.getElementById("workspace-wrapper") && document.getElementById("operations")) {
            clearInterval(t);
            fn(window.app);
        }
    }, 100);
}

whenAppReady(app => {
    const wrapper = document.getElementById("workspace-wrapper");
    const ops = document.getElementById("operations");

    // the pane: over the recipe and IO panes, from just right of the operations list (its gutter stays draggable)
    const pane = document.createElement("div");
    pane.id = "graph-pane";
    pane.style.cssText = "position:absolute; top:0; bottom:0; right:0; display:none; flex-direction:column; background:#222; z-index:5;";
    const barHost = document.createElement("div");
    const canvasEl = document.createElement("canvas");
    canvasEl.id = "graph-canvas";
    canvasEl.style.display = "block";
    pane.appendChild(barHost);
    pane.appendChild(canvasEl);
    wrapper.appendChild(pane);

    let mode = "linear";
    const linkFor = json => window.location.href.split("#")[0] + "#graph=" + graphToLink(json);
    const editor = createGraphEditor(canvasEl, {
        onSave: json => {
            try {
                localStorage.setItem(GRAPH_KEY, JSON.stringify(json));
            } catch (e) {
                // a full or blocked storage leaves the graph in the link alone
            }
            if (mode === "graph") window.history.replaceState({}, document.title, "#graph=" + graphToLink(json));
        }
    });
    createGraphToolbar(barHost, editor, linkFor);

    /** the pane follows the operations list's width and the window */
    const layout = () => {
        const left = ops.offsetWidth + 4;
        pane.style.left = left + "px";
        if (mode === "graph") editor.resize(wrapper.clientWidth - left, wrapper.clientHeight - barHost.offsetHeight);
    };
    new ResizeObserver(layout).observe(ops);
    window.addEventListener("resize", layout);

    // the linear recipe's URL updates pause in Graph mode, so the address bar holds the graph there
    const updateURL = app.updateURL.bind(app);
    app.updateURL = function(...args) {
        if (mode !== "graph") return updateURL(...args);
    };

    // the switch
    const sw = document.createElement("span");
    sw.id = "editor-mode-switch";
    sw.style.cssText = "margin-left:14px; display:inline-flex; border:1px solid var(--primary-border-colour, #999); border-radius:4px; overflow:hidden; vertical-align:middle;";
    sw.innerHTML = '<button type="button" data-mode="linear" style="border:0; padding:1px 10px; cursor:pointer;">Recipe</button>' +
        '<button type="button" data-mode="graph" style="border:0; padding:1px 10px; cursor:pointer;">Graph</button>';
    const bannerLeft = document.querySelector("#banner .col");
    (bannerLeft || document.getElementById("banner")).appendChild(sw);

    /** switch editors; each keeps its own state */
    function setMode(m) {
        mode = m;
        try {
            localStorage.setItem(MODE_KEY, m);
        } catch (e) {
            // the mode is only a convenience
        }
        sw.querySelectorAll("button").forEach(b => {
            const on = b.dataset.mode === m;
            b.style.background = on ? "var(--primary-background-colour, #1e6fbf)" : "transparent";
            b.style.color = on ? "var(--primary-font-colour, #fff)" : "inherit";
            b.style.fontWeight = on ? "bold" : "normal";
        });
        if (m === "graph") {
            pane.style.display = "flex";
            layout();
            window.history.replaceState({}, document.title, "#graph=" + graphToLink(editor.serialize()));
            editor.scheduleRun();
        } else {
            pane.style.display = "none";
            updateURL(true, null, true);
        }
    }
    sw.addEventListener("click", e => {
        if (e.target.dataset.mode) setMode(e.target.dataset.mode);
    });

    // in Graph mode, double-clicking an operation in the list adds a node instead of a recipe step
    ops.addEventListener("dblclick", e => {
        if (mode !== "graph") return;
        const li = e.target.closest && e.target.closest("li.operation");
        if (!li) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        editor.addOperation(li.getAttribute("data-name") || li.textContent.trim());
    }, true);

    // the starting graph and mode: a #graph= link wins, then the last graph and mode, then the PK example
    const m = OPENED_HASH.match(/graph=([^&]+)/);
    let json = null, startMode = "linear";
    if (m) {
        try {
            json = graphFromLink(m[1]);
            startMode = "graph";
        } catch (e) {
            // a broken link falls back to the stored graph
        }
    }
    if (!json) {
        try {
            json = JSON.parse(localStorage.getItem(GRAPH_KEY) || "null");
            startMode = localStorage.getItem(MODE_KEY) || "linear";
        } catch (e) {
            json = null;
        }
    }
    const ready = editor.load(json);
    setMode(startMode);
    window.puzzlesGraphMode = {editor: editor, setMode: setMode, mode: () => mode, ready: ready};
});
