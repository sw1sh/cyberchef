// Bake every recipe in CyberChef's own Node engine and compare with PLAINTEXTS.md; print the links.
import chef from "../src/node/index.mjs";
import { recipes, ct, pts } from "./recipes.mjs";
let ok = 0;
for (const [i, name] of Object.keys(recipes).entries()) {
    const out = (await chef.bake(ct[name], recipes[name])).toString();
    const exact = out === pts[i];
    ok += exact;
    console.log("BAKE", name, exact ? "EXACT" : "DIFF", out.length, pts[i].length, out.slice(0, 20));
}
console.log("BAKE_SUMMARY", ok, "of", Object.keys(recipes).length);
