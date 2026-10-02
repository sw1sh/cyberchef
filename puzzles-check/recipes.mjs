// The PK1-10 recipes, every key a WORD, in CyberChef's recipe config form - shared by the Node bake check and the link
// generator.  PK5 chains PK4 inside its own recipe: Register keeps PK5's ciphertext as $R0, Find / Replace swaps in
// PK4's ciphertext, PK4 is decrypted, Register keeps its plaintext ($R1) and first 8 letters ($R2), and PK5's
// ciphertext comes back from $R0 to be deciphered with them.
import fs from "fs";
export const root = process.env.PUZZLES_ROOT || "/Users/swish/src/Crypto/puzzles/paradigm-kryptos-ctf";
export const ct = JSON.parse(fs.readFileSync(root + "/data/all-ciphertexts.json", "utf8"));
export const pts = [...fs.readFileSync(root + "/PLAINTEXTS.md", "utf8").matchAll(/`([A-Z]{100,})`/g)].map(m => m[1]);
const Q = keys => ({op: "Quagmire", args: ["Decrypt", "KRYPTOS", "KRYPTOS", keys, "Vigenere"]});
const COL = key => ({op: "Keyword Columnar", args: ["Decrypt", key, "TopToBottom"]});
const all = {option: "Regex", string: "^[\\s\\S]*$"};
const REPLACE = text => ({op: "Find / Replace", args: [all, text, true, false, true, false]});
export const recipes = {
    pk1: [Q("PROVENANCE")],
    pk2: [COL("HARDENS")],
    pk3: [Q("PENTIMENTO ORDINATE")],
    pk4: [Q("OCHRE VERDIGRIS"), COL("UNDERLAY")],
    pk5: [{op: "Register", args: ["([\\s\\S]*)", true, false, false]}, REPLACE(ct.pk4), Q("OCHRE VERDIGRIS"), COL("UNDERLAY"),
          {op: "Register", args: ["(([A-Z]{8})[\\s\\S]*)", true, false, false]}, REPLACE("$R0"),
          {op: "Running Key", args: ["Decrypt", "$R1", "KRYPTOS", "KRYPTOS"]}, COL("$R2")],
    pk6: [Q("PORTAL"), COL("SMITHWORK"), COL("HANDIWORK")],
    pk7: [{op: "Hill Keyword", args: ["Decrypt", "ALCHEMIST", "KRYPTOS"]}, Q("ANNEAL")],
    pk8: [Q("METE METER METIER MASTERY")],
    // PK9: the method posted by Colin Patrick - columnar BEAMWORK, a 12 x 12 clockwise spiral from the top-right corner
    // (the grid turned a quarter counter-clockwise, read SpiralIn), Quagmire III CLEPSYDRA
    pk9: [COL("BEAMWORK"), {op: "Grid Route", args: ["Decrypt", 12, 12, "Rotate270", "SpiralIn"]}, Q("CLEPSYDRA")],
    // PK10: every recipe of PK1-PK9 stacked with its own keys, undone from PK9 back to PK1 (method posted by Ron S);
    // PK9's spiral grows to 42 x 12, and PK5's step takes PK4's plaintext through the same Register swap as PK5
    pk10: [COL("BEAMWORK"), {op: "Grid Route", args: ["Decrypt", 42, 12, "Rotate270", "SpiralIn"]}, Q("CLEPSYDRA"),
           Q("METE METER METIER MASTERY"), {op: "Hill Keyword", args: ["Decrypt", "ALCHEMIST", "KRYPTOS"]}, Q("ANNEAL"),
           Q("PORTAL"), COL("SMITHWORK"), COL("HANDIWORK"),
           {op: "Register", args: ["([\\s\\S]*)", true, false, false]}, REPLACE(ct.pk4), Q("OCHRE VERDIGRIS"), COL("UNDERLAY"),
           {op: "Register", args: ["(([A-Z]{8})[\\s\\S]*)", true, false, false]}, REPLACE("$R0"),
           {op: "Running Key", args: ["Decrypt", "$R1", "KRYPTOS", "KRYPTOS"]}, COL("$R2"),
           Q("OCHRE VERDIGRIS"), COL("UNDERLAY"), Q("PENTIMENTO ORDINATE"), COL("HARDENS"), Q("PROVENANCE")]
};
