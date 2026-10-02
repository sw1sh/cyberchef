/**
 * A small client for CyberChef's own ChefWorker, so the graph editor and the recipe book bake with exactly the engine
 * the main app uses (operation modules loaded on demand from ./modules/).
 *
 * @license Apache-2.0
 */

import ChefWorker from "worker-loader?inline=no-fallback!../../core/ChefWorker.js";
import Utils from "../../core/Utils.mjs";

/**
 * Bakes recipes on one ChefWorker, one request at a time per id.
 */
export class ChefClient {

    /**
     * ChefClient constructor
     */
    constructor() {
        this.worker = new ChefWorker();
        this.next = 1;
        this.pending = new Map();
        const docURL = window.location.href.split(/[#?]/)[0].replace(/\/[^/]*$/, "");
        this.worker.postMessage({action: "docURL", data: docURL});
        this.worker.addEventListener("message", e => {
            const r = e.data;
            if (!r || !r.data || !this.pending.has(r.data.id)) return;
            const {resolve, reject} = this.pending.get(r.data.id);
            this.pending.delete(r.data.id);
            if (r.action === "bakeComplete") {
                if (r.data.error) reject(new Error(typeof r.data.error === "string" ? r.data.error : (r.data.error.displayStr || JSON.stringify(r.data.error))));
                else resolve(ChefClient.dishToString(r.data.dish));
            } else if (r.action === "bakeError") {
                reject(new Error(typeof r.data.error === "string" ? r.data.error : (r.data.error.displayStr || JSON.stringify(r.data.error))));
            }
        });
    }

    /**
     * A baked dish as text: strings as they are, bytes decoded as UTF-8.
     * @param {Object} dish
     * @returns {string}
     */
    static dishToString(dish) {
        if (!dish) return "";
        const v = dish.value;
        if (typeof v === "string") return v;
        if (v instanceof ArrayBuffer) return new TextDecoder().decode(new Uint8Array(v));
        if (Array.isArray(v)) return Utils.byteArrayToChars(v);
        if (v === undefined || v === null) return "";
        return typeof v === "object" ? JSON.stringify(v) : String(v);
    }

    /**
     * Bake a recipe on an input.
     * @param {string} input
     * @param {Object[]} recipeConfig
     * @returns {Promise<string>}
     */
    bake(input, recipeConfig) {
        const id = this.next++;
        return new Promise((resolve, reject) => {
            this.pending.set(id, {resolve, reject});
            this.worker.postMessage({action: "bake", data: {input: input, recipeConfig: recipeConfig, options: {}, id: id, inputNum: id}});
        });
    }
}

/**
 * A recipe as CyberChef's own URL recipe string, and a link that opens it in the main app.
 * @param {Object[]} recipeConfig
 * @param {string} input
 * @returns {string}
 */
export function cyberChefLink(recipeConfig, input) {
    const base = window.location.href.split(/[#?]/)[0].replace(/[^/]*$/, "") + "index.html";
    const b64 = btoa(unescape(encodeURIComponent(input)));
    return base + "#recipe=" + Utils.encodeURIFragment(Utils.generatePrettyRecipe(recipeConfig)) + "&input=" + Utils.encodeURIFragment(b64);
}
