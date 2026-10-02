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
await page.waitForFunction(() => window.puzzlesBook && window.puzzlesBook.book.length === 9, {timeout: 60000});
for (let i = 0; i < 9; i++) {
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
for (let k = 0; k < 9; k++) {
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
const collapsed = await page.evaluate(() => {
    const ns = window.puzzlesGraph.graph._nodes;
    return [ns.filter(n => n.opName).every(n => n.flags.collapsed), ns.filter(n => n.type === "Puzzles/Text").some(n => n.flags.collapsed)];
});
const collapsedOk = collapsed[0] && !collapsed[1];
console.log("GRAPH cipher nodes collapsed by default", collapsedOk ? "OK" : "FAILED", JSON.stringify(collapsed));
ok += collapsedOk ? 0 : -100;
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
// clicking in the standalone graph must not scroll its toolbar away either
await page.mouse.click(700, 500);
await page.mouse.click(900, 700);
await new Promise(r => setTimeout(r, 300));
const sbar = await page.evaluate(() => [document.querySelector(".pz-bar").getBoundingClientRect().top >= 0, document.body.scrollTop, document.scrollingElement.scrollTop]);
const sbarOk = sbar[0] && sbar[1] === 0 && sbar[2] === 0;
console.log("GRAPH toolbar after clicks", sbarOk ? "OK" : "FAILED", JSON.stringify(sbar));
ok += sbarOk ? 0 : -100;

// outputs: a collapsed node still shows its output under its title; clicking the output shows it in full (wrapped,
// no ellipsis), clicking again folds it back to one line
const outCheck = await page.evaluate(async () => {
    const g = window.puzzlesGraph.graph, cv = window.puzzlesGraph.canvas;
    const node = g._nodes.find(n => n.properties && n.properties.panel === "pk1");
    node.flags.collapsed = true; // collapse(true) toggles in LiteGraph 0.7
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
    node.flags.collapsed = true; // collapse(true) toggles in LiteGraph 0.7
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
await clickSel('#editor-mode-switch [data-mode="graph"]');
await page.evaluate(() => window.puzzlesGraphMode.ready);
let gp = {};
for (let t = 0; t < 60; t++) {
    gp = await page.evaluate(() => window.puzzlesGraphMode.editor.panels());
    if (Object.keys(gp).length >= 8 && [...Array(8).keys()].every(k => gp["pk" + (k + 1)] === undefined || true)) {
        if ([...Array(9).keys()].every(k => gp["pk" + (k + 1)])) break;
    }
    await new Promise(r => setTimeout(r, 250));
}
const inApp = [...Array(9).keys()].filter(k => gp["pk" + (k + 1)] === pts[k]).length;
const shown = await page.evaluate(() => [getComputedStyle(document.getElementById("graph-pane")).display, window.location.hash.startsWith("#graph="),
    getComputedStyle(document.getElementById("recipe")).visibility, getComputedStyle(document.querySelector("#IO")).visibility]);
modeOk += inApp === 9 && shown[0] === "flex" && shown[1] && shown[2] === "hidden" && shown[3] === "hidden";
// clicking in the graph must not scroll the page: the banner (with the switch) stays at the top
await new Promise(r => setTimeout(r, 300));
await page.mouse.click(900, 500);
await page.mouse.click(1200, 300);
await new Promise(r => setTimeout(r, 300));
const bannerTop = await page.evaluate(() => [document.getElementById("banner").getBoundingClientRect().top, document.scrollingElement.scrollTop,
    document.scrollingElement.scrollHeight <= document.scrollingElement.clientHeight,
    document.getElementById("graph-pane").scrollTop, document.querySelector("#graph-pane .pz-bar").getBoundingClientRect().top]);
const bannerOk = bannerTop[0] === 0 && bannerTop[1] === 0 && bannerTop[2] && bannerTop[3] === 0 && bannerTop[4] === 30;
console.log("APPMODE banner after clicks in the graph", bannerOk ? "OK" : "FAILED", JSON.stringify(bannerTop));
modeOk += bannerOk ? 0 : -100;
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
await clickSel('#editor-mode-switch [data-mode="linear"]');
const backState = await page.evaluate(() => [getComputedStyle(document.getElementById("graph-pane")).display, window.location.hash.includes("graph="), getComputedStyle(document.getElementById("recipe")).visibility]);
modeOk += backState[0] === "none" && !backState[1] && backState[2] === "visible";
await page.goto("about:blank");
await page.goto(glinkApp, {waitUntil: "networkidle0"});
await page.waitForFunction(() => window.puzzlesGraphMode, {timeout: 60000});
const reopened = await page.evaluate(() => window.puzzlesGraphMode.mode());
modeOk += reopened === "graph";
console.log("APPMODE start", startMode.join("/"), "| graph panels exact", inApp, "of 9 | shown", shown.join("/"), "| dblclick adds node", n0, "->", n1, "recipe", recipeLen,
    "| save/clear/load", nClear, nLoad, "| back to recipe", backState.join("/"), "| link reopens", reopened);
console.log("APPMODE_SUMMARY", modeOk, "of 6");
console.log("PAGES_SUMMARY", ok + (live ? 1 : 0), "of 19");
await browser.close();
