// The PK1-8 decryptions through the ported library, compared byte for byte with PLAINTEXTS.md.
import fs from "fs";
import { vigenere, columnar, hill } from "../src/core/lib/PuzzlesClassical.mjs";
const root = "/Users/swish/src/Crypto/puzzles/paradigm-kryptos-ctf";
const ct = JSON.parse(fs.readFileSync(root + "/data/all-ciphertexts.json", "utf8"));
const pts = [...fs.readFileSync(root + "/PLAINTEXTS.md", "utf8").matchAll(/`([A-Z]{100,})`/g)].map(m => m[1]);
const clean = s => s.toUpperCase().replace(/[^A-Z]/g, "");
const q = (t, k) => vigenere(t, Array.isArray(k) ? k : [k], "Decrypt", "KRYPTOS", "KRYPTOS");
const c = (t, k) => columnar(t, k, "Decrypt");
const h = (t, k) => hill(t, k, "Decrypt", "KRYPTOS");
const C = i => clean(ct["pk" + i]);
const pt4 = c(q(C(4), ["OCHRE", "VERDIGRIS"]), "UNDERLAY");
const got = [
  q(C(1), "PROVENANCE"), c(C(2), "HARDENS"), q(C(3), ["PENTIMENTO", "ORDINATE"]), pt4,
  c(q(C(5), pt4), pt4.slice(0, 8)), c(c(q(C(6), "PORTAL"), "SMITHWORK"), "HANDIWORK"),
  q(h(C(7), "ALCHEMIST"), "ANNEAL"), q(C(8), ["METE", "METER", "METIER", "MASTERY"])];
console.log("plaintexts found:", pts.length);
got.forEach((g, i) => console.log("PK" + (i + 1), g === pts[i] ? "EXACT" : "DIFF", g.length, (pts[i] || "").length, g.slice(0, 24)));
