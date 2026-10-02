// The recipe book and the recipe graph in headless Chrome against the built pages: every PK1-8 output byte-exact with
// PLAINTEXTS.md - the book entry by entry, the graph's View nodes after its own Run.
import puppeteer from "puppeteer";
import { pts } from "./recipes.mjs";
const base = "file://" + process.cwd() + "/build/prod/";
const browser = await puppeteer.launch({headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"]});
const page = await browser.newPage();
await page.setViewport({width: 1400, height: 900});
/** click an element by selector in the page itself (a DOM click, as a user's click delivers it) */
const clickSel = sel => page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) throw new Error("no element " + sel);
    el.click();
}, sel);
page.on("pageerror", e => console.log("PAGEERROR", e.message.slice(0, 200)));
let ok = 0;
await page.goto(base + "book.html", {waitUntil: "networkidle0"});
await page.waitForFunction(() => window.puzzlesBook && window.puzzlesBook.book.length === 8, {timeout: 60000});
for (let i = 0; i < 8; i++) {
    await page.evaluate(i => window.puzzlesBook.show(i), i);
    let out = "";
    for (let t = 0; t < 60; t++) {
        out = await page.evaluate(() => document.getElementById("output").value);
        if (out === pts[i]) break;
        await new Promise(r => setTimeout(r, 500));
    }
    ok += out === pts[i];
    console.log("BOOK", "pk" + (i + 1), out === pts[i] ? "EXACT" : "DIFF", out.slice(0, 30));
}
const bookLink = await page.evaluate(() => window.location.hash.length);
console.log("BOOK link fragment length", bookLink);
await page.goto("about:blank");
await page.goto(base + "graph.html", {waitUntil: "networkidle0"});
await page.waitForFunction(() => window.puzzlesGraph && window.puzzlesGraph.ready, {timeout: 60000});
await page.evaluate(() => window.puzzlesGraph.ready.then(() => true));
const panels = await page.evaluate(() => window.puzzlesGraph.panels());
for (let k = 0; k < 8; k++) {
    const v = panels["pk" + (k + 1)] || "";
    ok += v === pts[k];
    console.log("GRAPH", "pk" + (k + 1), v === pts[k] ? "EXACT" : "DIFF", v.slice(0, 30));
}
const extra = await page.evaluate(() => {
    const g = window.puzzlesGraph.graph;
    const alpha = g._nodes.find(n => n.title === "Alphabet");
    const fed = alpha ? alpha.outputs[0].links.length : 0;
    const texts = g._nodes.filter(n => n.type === "Puzzles/Text").map(n => n.title);
    return {fed, texts, views: g._nodes.filter(n => n.type === "Puzzles/View").length};
});
console.log("GRAPH alphabet node feeds", extra.fed, "fields | text nodes", extra.texts.join(", "), "| view nodes", extra.views);
const glink = await page.evaluate(() => window.location.hash.length);
console.log("GRAPH link fragment length", glink);
// live: change the alphabet node the way the UI does (value, then the widget's callback), with no Run - PK1 must
// change; restore it - PK1 must come back exact
const setAlphabet = v => page.evaluate(v => {
    const n = window.puzzlesGraph.graph._nodes.find(x => x.title === "Alphabet");
    n.widgets[0].value = v;
    n.widgets[0].callback(v, null, n);
}, v);
const pk1Now = () => page.evaluate(() => window.puzzlesGraph.panels().pk1);
await setAlphabet("");
let changed = "";
for (let t = 0; t < 40; t++) {
    changed = await pk1Now();
    if (changed && changed !== pts[0]) break;
    await new Promise(r => setTimeout(r, 250));
}
await setAlphabet("KRYPTOS");
let back = "";
for (let t = 0; t < 40; t++) {
    back = await pk1Now();
    if (back === pts[0]) break;
    await new Promise(r => setTimeout(r, 250));
}
const live = changed !== pts[0] && back === pts[0];
console.log("GRAPH live edit", live ? "OK" : "FAILED", "| A-Z alphabet gives", changed.slice(0, 20), "| KRYPTOS again exact", back === pts[0]);
// outputs: a collapsed node still shows its output under its title; clicking the output shows it in full (wrapped,
// no ellipsis), clicking again folds it back to one line
const outCheck = await page.evaluate(async () => {
    const g = window.puzzlesGraph.graph, cv = window.puzzlesGraph.canvas;
    const node = g._nodes.find(n => n.properties && n.properties.panel === "pk1");
    node.collapse(true);
    cv.draw(true, true);
    const r1 = node._outputRect && node._outputRect.slice();
    const atCollapsed = !!r1 && Math.abs(r1[1] - (node.pos[1] + 2)) < 1;
    const click = () => {
        const r = node._outputRect;
        const off = cv.convertOffsetToCanvas([r[0] + 20, r[1] + 5]); // graph -> screen in LiteGraph 0.7's naming
        const b = cv.canvas.getBoundingClientRect();
        const opts = {bubbles: true, clientX: b.left + off[0], clientY: b.top + off[1], pointerId: 1, button: 0};
        cv.canvas.dispatchEvent(new PointerEvent("pointerdown", opts));
        cv.canvas.dispatchEvent(new PointerEvent("pointerup", opts));
        cv.draw(true, true);
    };
    click();
    const r2 = node._outputRect.slice();
    const fullOn = !!node.properties.showOutput && r2[3] > 2 * 15;
    click();
    const r3 = node._outputRect.slice();
    const fullOff = !node.properties.showOutput && r3[3] < 2 * 15;
    node.collapse(true);
    cv.draw(true, true);
    return {atCollapsed, fullOn, fullOff, heights: [r1 && r1[3], r2[3], r3[3]]};
});
const outOk = outCheck.atCollapsed && outCheck.fullOn && outCheck.fullOff;
console.log("GRAPH output display", outOk ? "OK" : "FAILED", JSON.stringify(outCheck));
ok += outOk ? 0 : -100;

// Graph mode inside the main app: Recipe by default, the switch shows the graph with PK1-8 exact and a #graph= link,
// double-clicking an operation adds a node, Save / Clear / Load round-trip, Recipe again hides it and drops the link,
// and the #graph= link opens straight into Graph mode
let modeOk = 0;
page.on("dialog", d => d.accept());
await page.goto("about:blank");
await page.goto(base + "index.html", {waitUntil: "networkidle0"});
await page.waitForFunction(() => window.puzzlesGraphMode, {timeout: 60000});
const startMode = await page.evaluate(() => [window.puzzlesGraphMode.mode(), getComputedStyle(document.getElementById("graph-pane")).display]);
modeOk += startMode[0] === "linear" && startMode[1] === "none";
await clickSel('#to-graph-mode');
await page.evaluate(() => window.puzzlesGraphMode.ready);
let gp = {};
for (let t = 0; t < 60; t++) {
    gp = await page.evaluate(() => window.puzzlesGraphMode.editor.panels());
    if (Object.keys(gp).length >= 8 && [...Array(8).keys()].every(k => gp["pk" + (k + 1)] === undefined || true)) {
        if ([...Array(8).keys()].every(k => gp["pk" + (k + 1)])) break;
    }
    await new Promise(r => setTimeout(r, 250));
}
const inApp = [...Array(8).keys()].filter(k => gp["pk" + (k + 1)] === pts[k]).length;
const shown = await page.evaluate(() => [getComputedStyle(document.getElementById("graph-pane")).display, window.location.hash.startsWith("#graph="),
    getComputedStyle(document.getElementById("recipe")).visibility, getComputedStyle(document.querySelector("#IO")).visibility]);
modeOk += inApp === 8 && shown[0] === "flex" && shown[1] && shown[2] === "hidden" && shown[3] === "hidden";
const n0 = await page.evaluate(() => window.puzzlesGraphMode.editor.graph._nodes.length);
await page.evaluate(() => {
    const li = [...document.querySelectorAll("#categories li.operation")].find(l => l.textContent.trim() === "To Base64");
    li.dispatchEvent(new MouseEvent("dblclick", {bubbles: true}));
});
const n1 = await page.evaluate(() => window.puzzlesGraphMode.editor.graph._nodes.length);
const recipeLen = await page.evaluate(() => window.app.getRecipeConfig().length);
modeOk += n1 === n0 + 1 && recipeLen === 0;
await clickSel('.pz-bar [data-a="save"]');
await page.evaluate(() => {
    document.querySelector('.pz-dialog [data-f="name"]').value = "check graph";
});
await clickSel('.pz-dialog [data-b="store"]');
await clickSel('.pz-bar [data-a="clear"]');
const nClear = await page.evaluate(() => window.puzzlesGraphMode.editor.graph._nodes.length);
await clickSel('.pz-bar [data-a="load"]');
await clickSel('.pz-dialog [data-load]');
const nLoad = await page.evaluate(() => window.puzzlesGraphMode.editor.graph._nodes.length);
modeOk += nClear === 0 && nLoad === n1;
const glinkApp = await page.evaluate(() => window.location.href);
await clickSel('.pz-bar [data-a="recipe"]');
const backState = await page.evaluate(() => [getComputedStyle(document.getElementById("graph-pane")).display, window.location.hash.includes("graph="), getComputedStyle(document.getElementById("recipe")).visibility]);
modeOk += backState[0] === "none" && !backState[1] && backState[2] === "visible";
await page.goto("about:blank");
await page.goto(glinkApp, {waitUntil: "networkidle0"});
await page.waitForFunction(() => window.puzzlesGraphMode, {timeout: 60000});
const reopened = await page.evaluate(() => window.puzzlesGraphMode.mode());
modeOk += reopened === "graph";
console.log("APPMODE start", startMode.join("/"), "| graph panels exact", inApp, "of 8 | shown", shown.join("/"), "| dblclick adds node", n0, "->", n1, "recipe", recipeLen,
    "| save/clear/load", nClear, nLoad, "| back to recipe", backState.join("/"), "| link reopens", reopened);
console.log("APPMODE_SUMMARY", modeOk, "of 6");
console.log("PAGES_SUMMARY", ok + (live ? 1 : 0), "of 17");
await browser.close();
