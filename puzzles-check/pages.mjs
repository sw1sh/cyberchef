// The recipe book and the recipe graph in headless Chrome against the built pages: every PK1-8 output byte-exact with
// PLAINTEXTS.md - the book entry by entry, the graph's View nodes after its own Run.
import puppeteer from "puppeteer";
import { pts } from "./recipes.mjs";
const base = "file://" + process.cwd() + "/build/prod/";
const browser = await puppeteer.launch({headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"]});
const page = await browser.newPage();
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
const views = await page.evaluate(() => window.puzzlesGraph.graph._nodes.filter(n => n.type === "Puzzles/View").map(n => [n.title, n.value || ""]));
views.sort();
views.forEach(([title, v], i) => {
    const k = parseInt(title.slice(2), 10) - 1;
    ok += v === pts[k];
    console.log("GRAPH", title, v === pts[k] ? "EXACT" : "DIFF", v.slice(0, 30));
});
const glink = await page.evaluate(() => window.location.hash.length);
console.log("GRAPH nodes", views.length, "link fragment length", glink);
console.log("PAGES_SUMMARY", ok, "of 16");
await browser.close();
