// Load each recipe's link in a real (headless) Chrome against the built page and compare the rendered output with
// PLAINTEXTS.md; write the links (for a local server at BASE) to links.txt.
import fs from "fs";
import puppeteer from "puppeteer";
import { recipes, ct, pts } from "./recipes.mjs";
const page0 = "index.html";
const fileURL = "file://" + process.cwd() + "/build/prod/" + page0;
const BASE = process.env.CC_BASE || "http://localhost:8765/" + page0;
const browser = await puppeteer.launch({headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"]});
const page = await browser.newPage();
await page.goto(fileURL, {waitUntil: "networkidle0"});
await page.waitForFunction(() => window.app && window.app.manager && window.app.manager.output && window.app.manager.output.outputEditorView, {timeout: 60000});
const links = [];
let ok = 0;
for (const [i, name] of Object.keys(recipes).entries()) {
    const b64 = Buffer.from(ct[name], "utf8").toString("base64");
    const hash = await page.evaluate((cfg, b64) => {
        const u = window.app.manager.controls.generateStateUrl(true, true, b64, cfg, "X");
        return u.slice(u.indexOf("#"));
    }, recipes[name], b64);
    links.push(name + " " + BASE + hash);
    await page.goto("about:blank");
    await page.goto(fileURL + hash, {waitUntil: "networkidle0"});
    await page.waitForFunction(() => window.app && window.app.manager && window.app.manager.output && window.app.manager.output.outputEditorView, {timeout: 60000});
    let out = "";
    for (let t = 0; t < 60; t++) {
        out = await page.evaluate(() => window.app.manager.output.outputEditorView.state.doc.toString());
        if (out === pts[i]) break;
        await new Promise(r => setTimeout(r, 500));
    }
    const exact = out === pts[i];
    ok += exact;
    console.log("BROWSER", name, exact ? "EXACT" : "DIFF", out.length, pts[i].length, out.slice(0, 20));
}
fs.writeFileSync("links.txt", links.join("\n") + "\n");
console.log("BROWSER_SUMMARY", ok, "of", Object.keys(recipes).length);
await browser.close();
