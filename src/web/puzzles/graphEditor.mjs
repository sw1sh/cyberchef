/**
 * The recipe GRAPH editor: CyberChef operations as nodes on a canvas (LiteGraph, the node editor ComfyUI grew from),
 * wired output to input.  Every operation has a text input and a text output, a widget for each argument, and - for
 * every string argument - an input port that, when wired, takes the argument from another node's output: so one
 * panel's plaintext can be the next one's key.  The graph is live: any edit re-bakes it, in dependency order, one
 * operation at a time, on CyberChef's own worker.  Used by the standalone graph.html and by the Graph mode inside the
 * main CyberChef app; a graph is plain JSON (LiteGraph's own serialisation), kept in links as #graph= (lz-string).
 *
 * @license Apache-2.0
 */

import { LiteGraph, LGraph, LGraphCanvas } from "litegraph.js";
import "litegraph.js/css/litegraph.css";
import LZString from "lz-string";
import OperationConfig from "../../core/config/OperationConfig.json" with { type: "json" };
import Categories from "../../core/config/Categories.json" with { type: "json" };
import { ChefClient } from "./chefClient.mjs";
import { PK_CIPHERTEXTS, PK_BOOK } from "./pkData.mjs";

/** a node's graph re-bakes after an edit to it */
function nodeChanged(node) {
    const g = node && node.graph;
    if (g && g.puzzlesScheduleRun) g.puzzlesScheduleRun();
}

const chef = new ChefClient();
const STRINGY = new Set(["string", "shortString", "text", "binaryString", "binaryShortString", "editableOption", "editableOptionShort", "toggleString"]);

/** an argument's choice names, for a combo widget */
const choices = a => (Array.isArray(a.value) ? a.value.map(v => (typeof v === "string" ? v : v.name)) : []);

/** the argument's default as a recipe value */
function defaultArg(a) {
    switch (a.type) {
        case "option": case "argSelector": case "populateOption": case "populateMultiOption":
            return choices(a)[0];
        case "editableOption": case "editableOptionShort":
            return Array.isArray(a.value) && a.value.length ? a.value[0].value : "";
        case "toggleString":
            return {option: (a.toggleValues || [""])[0], string: a.value || ""};
        default:
            return a.value;
    }
}

/** the CyberChef category an operation is filed under (not Favourites) */
const categoryOf = {};
Categories.forEach(c => {
    if (c.name === "Favourites") return;
    c.ops.forEach(op => {
        if (!categoryOf[op]) categoryOf[op] = c.name;
    });
});

/** register one CyberChef operation as a node type */
function registerOp(name, cfg) {
    /** an operation node */
    function OpNode() {
        this.addInput("input", "string");
        this.argPorts = {};
        this.argWidgets = [];
        (cfg.args || []).forEach((a, i) => {
            if (a.type === "label") {
                this.argWidgets.push(null);
                return;
            }
            const d = defaultArg(a);
            let w;
            if (a.type === "boolean") w = this.addWidget("toggle", a.name, !!a.value, (v, c, node) => nodeChanged(node));
            else if (a.type === "number") w = this.addWidget("number", a.name, a.value, (v, c, node) => nodeChanged(node), {precision: 0, step: 10});
            else if (["option", "argSelector", "populateOption", "populateMultiOption"].includes(a.type)) w = this.addWidget("combo", a.name, d, (v, c, node) => nodeChanged(node), {values: choices(a)});
            else if (a.type === "toggleString") {
                w = this.addWidget("text", a.name, d.string, (v, c, node) => nodeChanged(node));
                w.toggle = this.addWidget("combo", a.name + " (format)", d.option, (v, c, node) => nodeChanged(node), {values: a.toggleValues || [""]});
            } else w = this.addWidget("text", a.name, d === undefined || d === null ? "" : String(d), (v, c, node) => nodeChanged(node));
            w.argType = a.type;
            this.argWidgets.push(w);
            if (STRINGY.has(a.type)) {
                this.addInput(a.name, "string");
                this.argPorts[a.name] = i;
            }
        });
        this.addOutput("output", "string");
        this.serialize_widgets = true; // eslint-disable-line camelcase
        this.size = this.computeSize();
        this.size[0] = Math.max(this.size[0], 240);
        this.preview = "";
    }
    OpNode.title = name;
    OpNode.desc = (cfg.description || "").replace(/<[^>]+>/g, "").slice(0, 200);
    OpNode.prototype.opName = name;
    LiteGraph.registerNodeType("CyberChef/" + (categoryOf[name] || "Other") + "/" + name, OpNode);
}


/** a text source */
function TextNode() {
    this.addOutput("text", "string");
    this.addWidget("text", "text", "", (v, c, node) => nodeChanged(node));
    this.serialize_widgets = true; // eslint-disable-line camelcase
    this.size = [300, 60];
}
TextNode.title = "Text";
LiteGraph.registerNodeType("Puzzles/Text", TextNode);

/** a result: shows the text that reaches it, and checks it against "expected" when that is set */
function ViewNode() {
    this.addInput("text", "string");
    this.addWidget("text", "expected", "", (v, c, node) => nodeChanged(node));
    this.serialize_widgets = true; // eslint-disable-line camelcase
    this.size = [300, 60];
    this.preview = "";
}
ViewNode.title = "View";
ViewNode.prototype.onDrawForeground = function(ctx) {
    const exp = this.widgets[0].value;
    if (exp && this.value !== undefined) {
        ctx.fillStyle = this.value === exp ? "#5c5" : "#f55";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(this.value === exp ? "matches expected" : "differs from expected", 6, this.size[1] + 30);
    }
};
LiteGraph.registerNodeType("Puzzles/View", ViewNode);

Object.entries(OperationConfig).forEach(([name, cfg]) => registerOp(name, cfg));

/**
 * A graph editor on a canvas element.  onSave(graphJSON) is called after every run with the graph's serialisation.
 * @param {HTMLCanvasElement|string} canvasEl
 * @param {Object} [opts]
 * @returns {Object} the editor
 */
export function createGraphEditor(canvasEl, opts = {}) {
    const graph = new LGraph();
    const canvas = new LGraphCanvas(canvasEl, graph);
    graph.puzzlesScheduleRun = () => scheduleRun();

    /* every node's output is drawn under it - collapsed or not - as one line, or in full, wrapped, when its output box
       is clicked (the choice is kept in the node's properties, so it survives saving and links) */
    const CH = 7.25, LINE = 15;
    canvas.onDrawForeground = function(ctx) {
        ctx.save();
        ctx.font = "12px monospace";
        ctx.textBaseline = "top";
        graph._nodes.forEach(node => {
            const text = node.preview;
            node._outputRect = null;
            if (!text) return;
            const collapsed = node.flags && node.flags.collapsed;
            const full = !!(node.properties && node.properties.showOutput);
            const baseW = collapsed ? Math.max(node._collapsed_width || 140, 220) : node.size[0];
            const width = full ? Math.max(baseW, 420) : baseW;
            const per = Math.max(8, Math.floor((width - 10) / CH));
            let lines;
            if (full) {
                lines = [];
                text.split("\n").forEach(l => {
                    if (l.length === 0) lines.push("");
                    for (let p = 0; p < l.length; p += per) lines.push(l.slice(p, p + per));
                });
            } else {
                const first = text.split("\n")[0];
                lines = [first.length > per || text.includes("\n") ? first.slice(0, per - 1) + "\u2026" : first];
            }
            const x = node.pos[0], y = node.pos[1] + (collapsed ? 2 : node.size[1] + 4);
            const h = lines.length * LINE + 6;
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(x, y, width, h);
            ctx.fillStyle = node.error ? "#f66" : "#9c9";
            lines.forEach((l, i) => ctx.fillText(l, x + 5, y + 3 + i * LINE));
            node._outputRect = [x, y, width, h];
        });
        ctx.restore();
    };
    {
        let down = null;
        canvas.canvas.addEventListener("pointerdown", e => {
            down = [e.clientX, e.clientY];
        });
        canvas.canvas.addEventListener("pointerup", e => {
            if (!down || Math.abs(e.clientX - down[0]) > 4 || Math.abs(e.clientY - down[1]) > 4) return;
            const [gx, gy] = canvas.convertEventToCanvasOffset(e);
            const hit = graph._nodes.slice().reverse().find(n => n._outputRect && gx >= n._outputRect[0] && gx <= n._outputRect[0] + n._outputRect[2] &&
                gy >= n._outputRect[1] && gy <= n._outputRect[1] + n._outputRect[3]);
            if (hit) {
                hit.properties = Object.assign(hit.properties || {}, {showOutput: !(hit.properties && hit.properties.showOutput)});
                canvas.setDirty(true, true);
            }
        });
    }
    /* the graph is live: any edit - a widget, a wire, a node added or removed - re-bakes it shortly after, and a run that
       a newer one overtakes stops writing its results */
    let runGen = 0, runTimer = null, loading = false;
    /** re-bake the graph soon, once edits settle */
    function scheduleRun() {
        if (loading) return;
        clearTimeout(runTimer);
        runTimer = setTimeout(() => run(), 150);
    }
    graph.onConnectionChange = () => scheduleRun();
    graph.onNodeAdded = () => scheduleRun();
    graph.onNodeRemoved = () => scheduleRun();

    /** the text on a node's input slot, from the node wired into it */
    function inputValue(node, slot, values) {
        const inp = node.inputs && node.inputs[slot];
        if (!inp || inp.link === null || inp.link === undefined) return undefined;
        const link = graph.links[inp.link];
        return link ? values.get(link.origin_id) : undefined;
    }

    /** bake every node in dependency order; a node's output is the text its operation gives */
    async function run() {
        const gen = ++runGen;
        const order = graph.computeExecutionOrder(false);
        const values = new Map();
        for (const node of order) {
            node.error = false;
            if (node.type === "Puzzles/Text") {
                values.set(node.id, node.widgets[0].value || "");
            } else if (node.type === "Puzzles/View") {
                node.value = inputValue(node, 0, values);
                node.preview = node.value || "";
            } else if (node.opName) {
                const cfg = OperationConfig[node.opName];
                const args = (cfg.args || []).map((a, i) => {
                    const w = node.argWidgets[i];
                    if (!w) return a.value;
                    const port = node.inputs.findIndex(s => s.name === a.name);
                    const wired = port > 0 ? inputValue(node, port, values) : undefined;
                    if (a.type === "toggleString") return {option: w.toggle.value, string: wired !== undefined ? wired : w.value};
                    if (a.type === "number") return Number(w.value);
                    return wired !== undefined ? wired : w.value;
                });
                try {
                    const out = await chef.bake(inputValue(node, 0, values) || "", [{op: node.opName, args: args}]);
                    if (gen !== runGen) return values;
                    values.set(node.id, out);
                    node.preview = out;
                } catch (e) {
                    node.error = true;
                    node.preview = "Error: " + e.message;
                    values.set(node.id, "");
                }
            }
            node.setDirtyCanvas(true, true);
        }
        saveGraph();
        return values;
    }

    /** the graph into the address bar */
    function saveGraph() {
        if (opts.onSave) opts.onSave(graph.serialize());
    }

    /** add a node of a type at a place, with widget values */
    function add(type, x, y, values = {}) {
        const n = LiteGraph.createNode(type);
        n.pos = [x, y];
        graph.add(n);
        Object.entries(values).forEach(([k, v]) => {
            const w = n.widgets.find(w => w.name === k);
            if (w) w.value = v;
        });
        return n;
    }

    /** an operation node from a recipe entry */
    function addOp(entry, x, y) {
        const cat = categoryOf[entry.op] || "Other";
        const n = add("CyberChef/" + cat + "/" + entry.op, x, y);
        const cfg = OperationConfig[entry.op];
        (cfg.args || []).forEach((a, i) => {
            const w = n.argWidgets[i];
            if (!w || entry.args[i] === undefined) return;
            if (a.type === "toggleString") {
                w.value = entry.args[i].string;
                w.toggle.value = entry.args[i].option;
            } else w.value = entry.args[i];
        });
        return n;
    }

    /** the alphabet fields of an operation, by name, to wire from one alphabet node */
    const ALPHABET_PORTS = ["Plain alphabet keyword", "Cipher alphabet keyword", "Alphabet keyword"];

    /**
     * The PK1-10 example: one KRYPTOS node feeds every alphabet field; each solved panel is a chain from its ciphertext,
     * PK5's keys wired from PK4's output (the running key, and through Take bytes its first 8 letters as the columnar key);
     * PK9 and PK10 are their ciphertexts alone, ready for a recipe.  Each chain's last node is marked with its panel and
     * shows its output under it.
     */
    function pkExample() {
        loading = true;
        graph.clear();
        const alphabet = add("Puzzles/Text", 20, 20, {text: "KRYPTOS"});
        alphabet.title = "Alphabet";
        const wireAlphabet = n => ALPHABET_PORTS.forEach(name => {
            const slot = n.inputs.findIndex(s => s.name === name);
            if (slot > 0) alphabet.connect(0, n, slot);
        });
        const ends = {};
        let pk4out;
        const panels = Object.keys(PK_CIPHERTEXTS);
        panels.forEach((key, i) => {
            const y = 140 + i * 190;
            const src = add("Puzzles/Text", 20, y, {text: PK_CIPHERTEXTS[key]});
            src.title = key.toUpperCase() + " ciphertext";
            const entry = PK_BOOK[i];
            let prev = src, x = 360;
            const steps = !entry || key === "pk5" ? [] : entry.recipe;
            steps.forEach(op => {
                const n = addOp(op, x, y);
                wireAlphabet(n);
                prev.connect(0, n, 0);
                prev = n;
                x += 300;
            });
            if (key === "pk4") pk4out = prev;
            if (key === "pk5") {
                const rk = addOp({op: "Running Key", args: ["Decrypt", "", "KRYPTOS", "KRYPTOS"]}, x, y);
                wireAlphabet(rk);
                prev.connect(0, rk, 0);
                pk4out.connect(0, rk, rk.inputs.findIndex(s => s.name === "Key text"));
                const take = addOp({op: "Take bytes", args: [0, 8, false]}, x, y + 110);
                pk4out.connect(0, take, 0);
                const col = addOp({op: "Keyword Columnar", args: ["Decrypt", "", "TopToBottom"]}, x + 300, y);
                rk.connect(0, col, 0);
                take.connect(0, col, col.inputs.findIndex(s => s.name === "Key word"));
                prev = col;
            }
            if (prev !== src) {
                prev.properties = Object.assign(prev.properties || {}, {panel: key});
                prev.title = prev.title + " - " + key.toUpperCase();
            }
            ends[key] = prev;
        });
        loading = false;
        return ends;
    }


    /** add an operation node at the middle of the view */
    function addOperation(name) {
        if (!OperationConfig[name]) return null;
        const c = canvas.canvas;
        // LiteGraph 0.7's names run the other way: convertCanvasToOffset maps a screen point to graph coordinates
        const mid = canvas.convertCanvasToOffset([c.width / 2, c.height / 2]);
        const pos = [mid[0] - 120, mid[1] - 40];
        const n = addOp({op: name, args: (OperationConfig[name].args || []).map(defaultArg)}, pos[0], pos[1]);
        canvas.selectNode(n);
        return n;
    }

    /** scale and pan so every node is in view (at most 1:1) */
    function fit() {
        const nodes = graph._nodes;
        const c = canvas.canvas;
        if (!nodes.length || !c.width || !c.height) return;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        nodes.forEach(n => {
            x0 = Math.min(x0, n.pos[0]);
            y0 = Math.min(y0, n.pos[1] - 30);
            x1 = Math.max(x1, n.pos[0] + n.size[0]);
            y1 = Math.max(y1, n.pos[1] + n.size[1] + 40);
        });
        const pad = 40, w = x1 - x0 + 2 * pad, h = y1 - y0 + 2 * pad;
        const scale = Math.min(1, c.width / w, c.height / h);
        canvas.ds.scale = scale;
        canvas.ds.offset[0] = (c.width / scale - (x1 - x0)) / 2 - x0;
        canvas.ds.offset[1] = (c.height / scale - (y1 - y0)) / 2 - y0;
        canvas.setDirty(true, true);
    }

    /** load a graph (its JSON), or the PK example when given none; fitted to the view */
    function load(json) {
        if (json) {
            loading = true;
            graph.configure(typeof json === "string" ? JSON.parse(json) : json);
            loading = false;
        } else pkExample();
        fit();
        return run();
    }

    /** an empty graph */
    function clear() {
        graph.clear();
        saveGraph();
    }

    graph.start();
    return {
        graph: graph,
        canvas: canvas,
        run: run,
        scheduleRun: scheduleRun,
        load: load,
        clear: clear,
        example: () => load(null),
        fit: fit,
        addOperation: addOperation,
        serialize: () => graph.serialize(),
        resize: (w, h) => {
            canvas.canvas.width = w;
            canvas.canvas.height = h;
            canvas.resize();
        },
        panels: () => Object.fromEntries(graph._nodes.filter(n => n.properties && n.properties.panel).map(n => [n.properties.panel, n.preview || ""]))
    };
}

/** a graph as the compressed string a link carries, and back */
export const graphToLink = json => LZString.compressToEncodedURIComponent(JSON.stringify(json));
export const graphFromLink = s => JSON.parse(LZString.decompressFromEncodedURIComponent(s));
