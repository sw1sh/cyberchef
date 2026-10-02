/**
 * The recipe GRAPH: CyberChef operations as nodes on a canvas (LiteGraph, the node editor ComfyUI grew from), wired
 * output to input.  Every operation has a text input and a text output, a widget for each argument, and - for every
 * string argument - an input port that, when wired, takes the argument from another node's output: so one panel's
 * plaintext can be the next one's key.  Run bakes the graph in dependency order, one operation at a time, on
 * CyberChef's own worker; the address bar holds the whole graph (#graph=, lz-string compressed).
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
            if (a.type === "boolean") w = this.addWidget("toggle", a.name, !!a.value, () => {});
            else if (a.type === "number") w = this.addWidget("number", a.name, a.value, () => {}, {precision: 0, step: 10});
            else if (["option", "argSelector", "populateOption", "populateMultiOption"].includes(a.type)) w = this.addWidget("combo", a.name, d, () => {}, {values: choices(a)});
            else if (a.type === "toggleString") {
                w = this.addWidget("text", a.name, d.string, () => {});
                w.toggle = this.addWidget("combo", a.name + " (format)", d.option, () => {}, {values: a.toggleValues || [""]});
            } else w = this.addWidget("text", a.name, d === undefined || d === null ? "" : String(d), () => {});
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
    OpNode.prototype.onDrawForeground = drawPreview;
    LiteGraph.registerNodeType("CyberChef/" + (categoryOf[name] || "Other") + "/" + name, OpNode);
}

/** the first characters of a node's last output, under it */
function drawPreview(ctx) {
    if (this.flags.collapsed || !this.preview) return;
    ctx.fillStyle = this.error ? "#f66" : "#9c9";
    ctx.font = "12px monospace";
    const t = this.preview.length > 46 ? this.preview.slice(0, 46) + "..." : this.preview;
    ctx.fillText(t, 6, this.size[1] + 14);
}

/** a text source */
function TextNode() {
    this.addOutput("text", "string");
    this.addWidget("text", "text", "", () => {});
    this.serialize_widgets = true; // eslint-disable-line camelcase
    this.size = [300, 60];
}
TextNode.title = "Text";
LiteGraph.registerNodeType("Puzzles/Text", TextNode);

/** a result: shows the text that reaches it, and checks it against "expected" when that is set */
function ViewNode() {
    this.addInput("text", "string");
    this.addWidget("text", "expected", "", () => {});
    this.serialize_widgets = true; // eslint-disable-line camelcase
    this.size = [300, 60];
    this.preview = "";
}
ViewNode.title = "View";
ViewNode.prototype.onDrawForeground = function(ctx) {
    drawPreview.call(this, ctx);
    const exp = this.widgets[0].value;
    if (exp && this.value !== undefined) {
        ctx.fillStyle = this.value === exp ? "#5c5" : "#f55";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(this.value === exp ? "matches expected" : "differs from expected", 6, this.size[1] + 30);
    }
};
LiteGraph.registerNodeType("Puzzles/View", ViewNode);

Object.entries(OperationConfig).forEach(([name, cfg]) => registerOp(name, cfg));

const graph = new LGraph();
let canvas;

/** the text on a node's input slot, from the node wired into it */
function inputValue(node, slot, values) {
    const inp = node.inputs && node.inputs[slot];
    if (!inp || inp.link === null || inp.link === undefined) return undefined;
    const link = graph.links[inp.link];
    return link ? values.get(link.origin_id) : undefined;
}

/** bake every node in dependency order; a node's output is the text its operation gives */
async function run() {
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
    window.history.replaceState(null, "", "#graph=" + LZString.compressToEncodedURIComponent(JSON.stringify(graph.serialize())));
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
    return ends;
}

window.addEventListener("DOMContentLoaded", () => {
    canvas = new LGraphCanvas("#graph", graph);
    const resize = () => {
        const c = document.getElementById("graph");
        c.width = window.innerWidth;
        c.height = window.innerHeight - document.getElementById("bar").offsetHeight;
        canvas.resize();
    };
    window.addEventListener("resize", resize);
    resize();
    const m = window.location.hash.match(/graph=([^&]+)/);
    let loaded = false;
    if (m) {
        try {
            graph.configure(JSON.parse(LZString.decompressFromEncodedURIComponent(m[1])));
            loaded = true;
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Could not read the graph in the link", e);
        }
    }
    if (!loaded) pkExample();
    graph.start();
    document.getElementById("run").onclick = () => run();
    document.getElementById("example").onclick = () => {
        pkExample();
        run();
    };
    document.getElementById("clear").onclick = () => graph.clear();
    document.getElementById("share").onclick = () => {
        saveGraph();
        navigator.clipboard.writeText(window.location.href);
    };
    window.puzzlesGraph = {graph: graph, run: run, ready: run(),
        panels: () => Object.fromEntries(graph._nodes.filter(n => n.properties && n.properties.panel).map(n => [n.properties.panel, n.preview || ""]))};
});
