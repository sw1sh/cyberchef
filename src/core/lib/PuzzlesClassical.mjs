/**
 * Classical ciphers ported from the WolframInstitute/Puzzles paclet (Wolfram Language), so a CyberChef recipe and the
 * paclet give the same text for the same keys: KeyedAlphabet, VigenereCipher (Quagmire I-IV, summed keys),
 * ColumnarTransposition and HillCipher.  Each function follows the paclet definition it names; the comments quote the
 * rule it reproduces.
 *
 * @author WolframInstitute/Puzzles
 * @license Apache-2.0
 */

const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * KeyedAlphabet[keyword]: the keyword's letters, duplicates dropped, then the rest of A-Z.
 * @param {string} keyword
 * @returns {string}
 */
export function keyedAlphabet(keyword) {
    const seen = new Set(), out = [];
    for (const ch of (keyword.toUpperCase() + AZ)) {
        if (/[A-Z]/.test(ch) && !seen.has(ch)) {
            seen.add(ch);
            out.push(ch);
        }
    }
    return out.join("");
}

/**
 * classicalResolveAlphabet: empty -> A-Z; 26 distinct letters -> as given; anything else -> KeyedAlphabet.
 * @param {string} spec
 * @returns {string}
 */
export function resolveAlphabet(spec) {
    const up = (spec || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (up === "") return AZ;
    if (up.length === 26 && new Set(up).size === 26) return up;
    return keyedAlphabet(up);
}

/** the words of a key field: letters only, split on anything else */
export function keyWords(field) {
    return (field || "").toUpperCase().split(/[^A-Z]+/).filter(w => w.length > 0);
}

/**
 * classicalShiftIndex: the tableau step.
 *   Vigenere        enc c = (p + k) mod 26   dec p = (c - k) mod 26
 *   Beaufort        enc c = (k - p) mod 26   dec p = (k - c) mod 26
 *   VariantBeaufort enc c = (p - k) mod 26   dec p = (c + k) mod 26
 */
function shiftIndex(dir, variant, x, k) {
    const m = v => ((v % 26) + 26) % 26;
    if (variant === "Beaufort") return m(k - x);
    if (variant === "VariantBeaufort") return dir === "Encrypt" ? m(x - k) : m(x + k);
    return dir === "Encrypt" ? m(x + k) : m(x - k);
}

/**
 * VigenereCipher[text, key, dir, "Alphabet" -> {P, C}, "Variant" -> v] with one key: key letters indexed 0-based in the
 * PLAINTEXT alphabet; a letter not in the reading alphabet, or a non-letter, passes through without consuming the key;
 * the input's case is kept.
 */
function vigenereOne(text, key, dir, P, C, variant) {
    const pPos = new Map([...P].map((ch, i) => [ch, i])), cPos = new Map([...C].map((ch, i) => [ch, i]));
    const keyIdx = [...key.toUpperCase()].filter(ch => /[A-Z]/.test(ch)).map(ch => pPos.get(ch));
    if (keyIdx.length === 0 || keyIdx.some(k => k === undefined)) throw new Error("The key has no letters in the plaintext alphabet.");
    let j = 0, out = "";
    for (const orig of text) {
        const ch = orig.toUpperCase();
        const from = dir === "Encrypt" ? pPos : cPos;
        if (!/[A-Z]/.test(ch) || !from.has(ch)) {
            out += orig;
            continue;
        }
        const k = keyIdx[j % keyIdx.length];
        j++;
        const r = dir === "Encrypt" ? C[shiftIndex(dir, variant, pPos.get(ch), k)] : P[shiftIndex(dir, variant, cPos.get(ch), k)];
        out += orig === orig.toLowerCase() && orig !== orig.toUpperCase() ? r.toLowerCase() : r;
    }
    return out;
}

/**
 * VigenereCipher with several keys: one pass per key, decryption undoing the passes in reverse order (the summed
 * cycleword Quagmire over one alphabet).
 * @param {string} text
 * @param {string[]} keys
 * @param {string} dir "Encrypt" | "Decrypt"
 * @param {string} plainSpec alphabet spec for the plaintext side
 * @param {string} cipherSpec alphabet spec for the ciphertext side
 * @param {string} variant
 * @returns {string}
 */
export function vigenere(text, keys, dir, plainSpec, cipherSpec, variant = "Vigenere") {
    const P = resolveAlphabet(plainSpec), C = resolveAlphabet(cipherSpec);
    const order = dir === "Decrypt" ? [...keys].reverse() : keys;
    return order.reduce((t, k) => vigenereOne(t, k, dir, P, C, variant), text);
}

/**
 * columnarOrder: a keyword ranks its columns by (letter, original position) - ties left to right; a list of integers
 * is the read order, 1- or 0-based.
 */
export function columnarOrder(key) {
    const s = key.trim();
    if (/^[\d\s,]+$/.test(s)) {
        const nums = s.split(/[\s,]+/).filter(x => x !== "").map(Number);
        const min = Math.min(...nums);
        return nums.map(x => min >= 1 ? x - 1 : x);
    }
    const letters = [...s.toUpperCase()];
    return letters.map((ch, i) => [ch, i]).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1]).map(p => p[1]);
}

/**
 * ColumnarTransposition[text, key, dir, "Direction" -> d]: every character is a cell; the grid fills row by row, the
 * short last row in the leftmost columns; encryption reads the columns in key order, each top to bottom (or bottom to
 * top), decryption inverts it.
 */
export function columnar(text, key, dir, direction = "TopToBottom") {
    const order = columnarOrder(key), ncol = order.length;
    const sorted = [...order].sort((a, b) => a - b);
    if (ncol < 1 || sorted.some((v, i) => v !== i)) throw new Error("The key must be a keyword or a permutation of the columns.");
    const rev = direction === "BottomToTop";
    const letters = [...text], n = letters.length, rows = Math.ceil(n / ncol);
    const full = n % ncol === 0 ? ncol : n % ncol;
    const height = c => (c < full ? rows : rows - 1);
    const cells = c => {
        const idx = [];
        for (let p = c; p < n; p += ncol) idx.push(p);
        return rev ? idx.reverse() : idx;
    };
    if (dir === "Encrypt") return order.map(c => cells(c).map(p => letters[p]).join("")).join("");
    const out = new Array(n);
    let k = 0;
    for (const c of order) {
        const idx = cells(c);
        if (idx.length !== height(c)) throw new Error("column height mismatch");
        for (const p of idx) out[p] = letters[k++];
    }
    return out.join("");
}

/** the inverse of an integer matrix mod 26 (adjugate times the inverse determinant) */
function inverseMod26(m) {
    const n = m.length, mod = v => ((v % 26) + 26) % 26;
    const det = M => {
        if (M.length === 1) return M[0][0];
        let d = 0;
        for (let j = 0; j < M.length; j++) d += (j % 2 ? -1 : 1) * M[0][j] * det(minor(M, 0, j));
        return d;
    };
    const minor = (M, r, c) => M.filter((_, i) => i !== r).map(row => row.filter((_, j) => j !== c));
    const d = mod(det(m));
    let dinv = -1;
    for (let x = 1; x < 26; x++) if ((d * x) % 26 === 1) dinv = x;
    if (dinv < 0) throw new Error("The Hill key's determinant is not coprime to 26.");
    if (n === 1) return [[dinv]];
    const adj = [];
    for (let i = 0; i < n; i++) {
        adj.push([]);
        for (let j = 0; j < n; j++) adj[i].push(mod(((i + j) % 2 ? -1 : 1) * det(minor(m, j, i)) * dinv));
    }
    return adj;
}

/**
 * HillCipher[text, keyword, dir, "Alphabet" -> a]: the keyword's 0-based indices in the alphabet folded row by row into
 * an n x n matrix (a "r,c,...;..." matrix is taken as given); each whole block of n letters is a column vector b sent to
 * key . b mod 26 (the inverse to decrypt); a trailing partial block is unchanged; non-letters and case stay in place.
 */
export function hill(text, key, dir, alphaSpec) {
    const A = resolveAlphabet(alphaSpec), pos = new Map([...A].map((ch, i) => [ch, i]));
    let mat;
    if (/[;,\d]/.test(key) && !/[A-Za-z]/.test(key)) {
        mat = key.split(";").map(r => r.split(/[\s,]+/).filter(x => x !== "").map(Number));
    } else {
        const idx = [...key.toUpperCase()].filter(ch => /[A-Z]/.test(ch)).map(ch => pos.get(ch));
        const n = Math.round(Math.sqrt(idx.length));
        if (n * n !== idx.length) throw new Error("The Hill keyword must have a perfect-square letter count.");
        mat = [];
        for (let i = 0; i < n; i++) mat.push(idx.slice(i * n, i * n + n));
    }
    const n = mat.length, K = dir === "Encrypt" ? mat : inverseMod26(mat);
    const letters = [...text.toUpperCase()].filter(ch => pos.has(ch)), idx = letters.map(ch => pos.get(ch));
    const nb = Math.floor(idx.length / n), outIdx = [];
    for (let b = 0; b < nb; b++) {
        const v = idx.slice(b * n, b * n + n);
        for (let i = 0; i < n; i++) {
            let s = 0;
            for (let j = 0; j < n; j++) s += K[i][j] * v[j];
            outIdx.push(((s % 26) + 26) % 26);
        }
    }
    for (let i = nb * n; i < idx.length; i++) outIdx.push(idx[i]);
    let k = 0, out = "";
    for (const ch of text) {
        if (pos.has(ch.toUpperCase()) && /[A-Za-z]/.test(ch)) {
            const r = A[outIdx[k++]];
            out += ch === ch.toLowerCase() ? r.toLowerCase() : r;
        } else out += ch;
    }
    return out;
}

/**
 * TranspositionFamily["Route", n, {{rows, cols}, symmetry, pattern}]: the cell order a grid route reads - the text
 * written row by row into rows x cols, the grid turned or flipped by symmetry, then read off by pattern.
 * @returns {number[]} perm, perm[i] the 0-based source cell read at output i
 */
export function routePerm(rows, cols, symmetry, pattern) {
    const A = [];
    for (let r = 0; r < rows; r++) A.push(Array.from({length: cols}, (_, c) => r * cols + c));
    const T = M => M[0].map((_, j) => M.map(row => row[j]));
    const rev = M => [...M].reverse();
    const revRows = M => M.map(row => [...row].reverse());
    const sym = {
        Rows: M => M, Columns: T, Rotate90: M => T(rev(M)), Rotate180: M => rev(revRows(M)),
        Rotate270: M => rev(T(M)), FlipRows: revRows, FlipColumns: rev, AntiTranspose: M => rev(revRows(T(M)))
    }[symmetry];
    if (!sym) throw new Error("Unknown symmetry " + symmetry);
    const B = sym(A), h = B.length, w = B[0].length;
    const spiral = () => {
        let M = B.map(r => [...r]);
        const out = [];
        while (M.length > 0 && M[0].length > 0) {
            out.push(...M[0]);
            M = M.slice(1);
            if (M.length === 0 || M[0].length === 0) break;
            M = rev(T(M));
        }
        return out;
    };
    const diag = up => {
        const out = [];
        for (let d = 0; d <= h + w - 2; d++) {
            const lo = Math.max(0, d - w + 1), hi = Math.min(h - 1, d);
            if (up) for (let i = hi; i >= lo; i--) out.push(B[i][d - i]);
            else for (let i = lo; i <= hi; i++) out.push(B[i][d - i]);
        }
        return out;
    };
    switch (pattern) {
        case "Rows": return B.flat();
        case "Boustrophedon": return B.flatMap((row, i) => (i % 2 === 0 ? row : [...row].reverse()));
        case "Columns": return T(B).flat();
        case "ColumnBoustrophedon": return T(B).flatMap((col, j) => (j % 2 === 0 ? col : [...col].reverse()));
        case "SpiralIn": return spiral();
        case "SpiralOut": return spiral().reverse();
        case "Diagonals": return diag(false);
        case "AntiDiagonals": return diag(true);
        default: throw new Error("Unknown pattern " + pattern);
    }
}

/**
 * A grid route applied to every character: Encrypt reads output i from cell perm[i], Decrypt inverts it.
 */
export function gridRoute(text, rows, cols, symmetry, pattern, dir) {
    const chars = [...text];
    if (rows <= 0 && cols > 0 && chars.length % cols === 0) rows = chars.length / cols;
    if (chars.length !== rows * cols) throw new Error("The text has " + chars.length + " characters; the grid holds " + rows * cols + ".");
    const perm = routePerm(rows, cols, symmetry, pattern);
    if (dir === "Encrypt") return perm.map(p => chars[p]).join("");
    const out = new Array(chars.length);
    perm.forEach((p, i) => {
        out[p] = chars[i];
    });
    return out.join("");
}
