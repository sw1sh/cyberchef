/**
 * The graph editor's toolbar, shared by the standalone graph.html and the Graph mode of the main app: Run, Save, Load,
 * Clear, the PK example and Copy link.  Graphs are saved by name in the browser (localStorage "puzzles.graphs" - apart
 * from CyberChef's saved recipes, as a graph is not a linear recipe) and can be exported as JSON; Load lists them and
 * also takes pasted graph JSON or a graph link.
 *
 * @license Apache-2.0
 */

import { graphToLink, graphFromLink } from "./graphEditor.mjs";

const STORE = "puzzles.graphs";

/** the saved graphs, {name: graphJSON} */
function savedGraphs() {
    try {
        return JSON.parse(localStorage.getItem(STORE) || "{}");
    } catch (e) {
        return {};
    }
}

/** keep the saved graphs */
function storeGraphs(g) {
    try {
        localStorage.setItem(STORE, JSON.stringify(g));
    } catch (e) {
        window.alert("Could not save: " + e.message);
    }
}

/** a graph from pasted text: its JSON, a link with #graph=, or the compressed string alone */
function parseGraphText(text) {
    const t = text.trim();
    if (t.startsWith("{")) return JSON.parse(t);
    const m = t.match(/graph=([^&\s]+)/);
    return graphFromLink(m ? m[1] : t);
}

const CSS = `
.pz-bar { display: flex; gap: 6px; align-items: center; padding: 4px 8px; background: #2b2b2b; border-bottom: 1px solid #444; flex-wrap: wrap; font: 13px system-ui, sans-serif; color: #ddd; }
.pz-bar button { padding: 3px 10px; background: #3a3a3a; color: #eee; border: 1px solid #555; border-radius: 4px; cursor: pointer; }
.pz-bar button:hover { background: #474747; }
.pz-bar .pz-hint { color: #999; font-size: 12px; }
.pz-dialog { border: 1px solid #555; border-radius: 6px; background: #2b2b2b; color: #ddd; min-width: 420px; max-width: 90vw; font: 13px system-ui, sans-serif; }
.pz-dialog::backdrop { background: rgba(0,0,0,0.5); }
.pz-dialog h3 { margin: 0 0 8px; font-size: 15px; }
.pz-dialog textarea { width: 100%; min-height: 90px; background: #1e1e1e; color: #ddd; border: 1px solid #555; font: 12px ui-monospace, monospace; }
.pz-dialog input { width: 100%; background: #1e1e1e; color: #ddd; border: 1px solid #555; padding: 4px; }
.pz-dialog ul { list-style: none; padding: 0; margin: 6px 0; max-height: 240px; overflow: auto; }
.pz-dialog li { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid #3a3a3a; }
.pz-dialog button { padding: 3px 10px; margin: 2px; background: #3a3a3a; color: #eee; border: 1px solid #555; border-radius: 4px; cursor: pointer; }
.pz-dialog .pz-row { display: flex; gap: 6px; justify-content: flex-end; margin-top: 8px; }
/* LiteGraph appends its menus, value prompts, search box and panels to <body> at z-index 10 or so; in the app's Graph
   mode the canvas pane sits at 1000, so they would open behind it - raise them above it */
.litecontextmenu, .graphdialog, .litegraph.dialog, .litesearchbox { z-index: 3000 !important; }
`;

/** inject the toolbar's styles once */
function ensureStyles() {
    if (document.getElementById("pz-graph-css")) return;
    const s = document.createElement("style");
    s.id = "pz-graph-css";
    s.textContent = CSS;
    document.head.appendChild(s);
}

/** a dialog with HTML content; resolves when closed */
function dialog(html, wire) {
    const d = document.createElement("dialog");
    d.className = "pz-dialog";
    d.innerHTML = html;
    document.body.appendChild(d);
    wire(d, () => {
        d.close();
        d.remove();
    });
    d.addEventListener("close", () => d.remove());
    d.showModal();
    return d;
}

/**
 * Build the toolbar into container for editor.  linkFor(graphJSON) gives the shareable link.
 * @param {HTMLElement} container
 * @param {Object} editor
 * @param {Function} linkFor
 * @returns {HTMLElement}
 */
export function createGraphToolbar(container, editor, linkFor, extra = {}) {
    ensureStyles();
    const bar = document.createElement("div");
    bar.className = "pz-bar";
    bar.innerHTML = `
        <button data-a="run" title="Bake the graph now (it also re-bakes after every edit)">Run</button>
        <button data-a="save" title="Save this graph by name in the browser, or export it as JSON">Save</button>
        <button data-a="load" title="Load a saved graph, or paste graph JSON or a graph link">Load</button>
        <button data-a="clear" title="Empty the canvas">Clear</button>
        <button data-a="fit" title="Fit the whole graph in view">Fit</button>
        <button data-a="example" title="The Kryptos-CTF PK1-10 graph">PK example</button>
        <button data-a="link" title="Copy a link that holds the whole graph">Copy link</button>
        <span class="pz-hint">Double-click the canvas or an operation to add it; drag an output onto an input or a key port; click an output to see it all.</span>`;
    container.appendChild(bar);
    const actions = {
        run: () => editor.run(),
        fit: () => editor.fit(),
        clear: () => {
            if (window.confirm("Clear the graph?")) editor.clear();
        },
        example: () => editor.example(),
        link: () => navigator.clipboard.writeText(linkFor(editor.serialize())),
        save: () => {
            const json = JSON.stringify(editor.serialize());
            dialog(`<h3>Save graph</h3>
                <label>Name</label><input data-f="name" placeholder="my graph">
                <div class="pz-row"><button data-b="store">Save in browser</button><button data-b="download">Download JSON</button><button data-b="cancel">Cancel</button></div>
                <label>Graph JSON</label><textarea data-f="json" readonly></textarea>`, (d, close) => {
                d.querySelector("[data-f=json]").value = json;
                d.querySelector("[data-b=store]").onclick = () => {
                    const name = d.querySelector("[data-f=name]").value.trim() || ("graph " + new Date().toISOString().slice(0, 16));
                    const g = savedGraphs();
                    g[name] = JSON.parse(json);
                    storeGraphs(g);
                    close();
                };
                d.querySelector("[data-b=download]").onclick = () => {
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(new Blob([json], {type: "application/json"}));
                    a.download = (d.querySelector("[data-f=name]").value.trim() || "graph") + ".json";
                    a.click();
                };
                d.querySelector("[data-b=cancel]").onclick = close;
            });
        },
        load: () => {
            const g = savedGraphs();
            const items = Object.keys(g).map(n => `<li><span>${n.replace(/</g, "&lt;")}</span><span><button data-load="${encodeURIComponent(n)}">Load</button><button data-del="${encodeURIComponent(n)}">Delete</button></span></li>`).join("");
            dialog(`<h3>Load graph</h3>
                <ul>${items || "<li><i>No saved graphs yet.</i></li>"}</ul>
                <label>Or paste graph JSON or a graph link</label><textarea data-f="paste"></textarea>
                <div class="pz-row"><button data-b="paste">Load pasted</button><button data-b="cancel">Cancel</button></div>`, (d, close) => {
                d.querySelectorAll("[data-load]").forEach(b => {
                    b.onclick = () => {
                        editor.load(g[decodeURIComponent(b.dataset.load)]);
                        close();
                    };
                });
                d.querySelectorAll("[data-del]").forEach(b => {
                    b.onclick = () => {
                        const all = savedGraphs();
                        delete all[decodeURIComponent(b.dataset.del)];
                        storeGraphs(all);
                        b.closest("li").remove();
                    };
                });
                d.querySelector("[data-b=paste]").onclick = () => {
                    try {
                        editor.load(parseGraphText(d.querySelector("[data-f=paste]").value));
                        close();
                    } catch (e) {
                        window.alert("Not a graph: " + e.message);
                    }
                };
                d.querySelector("[data-b=cancel]").onclick = close;
            });
        }
    };
    bar.addEventListener("click", e => {
        const a = e.target.dataset && e.target.dataset.a;
        if (a && actions[a]) actions[a]();
    });
    return bar;
}

export { graphToLink, graphFromLink };
