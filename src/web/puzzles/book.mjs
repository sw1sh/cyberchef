/**
 * The recipe book: many recipes in ONE link, browsable.  The book is a list of {title, input, recipe} entries kept in the
 * URL fragment (#book=, lz-string compressed); each entry is baked by CyberChef's own worker and shown with its input,
 * its recipe and its output, a link that opens it in the main CyberChef, and its place in the list.  Entries can be
 * added from any CyberChef link, edited, reordered and removed; the address bar always holds the whole book.
 *
 * @license Apache-2.0
 */

import LZString from "lz-string";
import Utils from "../../core/Utils.mjs";
import { ChefClient, cyberChefLink } from "./chefClient.mjs";
import { PK_BOOK } from "./pkData.mjs";

const chef = new ChefClient();
let book = [];
let current = 0;
const $ = id => document.getElementById(id);

/** the book from the URL, or the PK1-8 book when the URL holds none */
function loadBook() {
    const m = window.location.hash.match(/book=([^&]+)/);
    if (m) {
        try {
            const parsed = JSON.parse(LZString.decompressFromEncodedURIComponent(m[1]));
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Could not read the book in the link", e);
        }
    }
    return JSON.parse(JSON.stringify(PK_BOOK));
}

/** write the book into the address bar */
function saveBook() {
    const hash = "#book=" + LZString.compressToEncodedURIComponent(JSON.stringify(book)) + "&page=" + (current + 1);
    window.history.replaceState(null, "", hash);
}

/** the entry list */
function renderList() {
    const ul = $("entries");
    ul.innerHTML = "";
    book.forEach((e, i) => {
        const li = document.createElement("li");
        li.className = i === current ? "active" : "";
        li.textContent = (i + 1) + ". " + (e.title || "untitled");
        li.onclick = () => show(i);
        ul.appendChild(li);
    });
}

/** bake and show one entry */
async function show(i) {
    current = Math.max(0, Math.min(i, book.length - 1));
    renderList();
    saveBook();
    const e = book[current];
    if (!e) return;
    $("title").value = e.title || "";
    $("input").value = e.input || "";
    $("recipe").value = Utils.generatePrettyRecipe(e.recipe || [], true);
    $("open").href = cyberChefLink(e.recipe || [], e.input || "");
    $("output").value = "baking...";
    $("status").textContent = "";
    try {
        const t0 = performance.now();
        const out = await chef.bake(e.input || "", e.recipe || []);
        if (current !== i) return;
        $("output").value = out;
        $("output").dataset.done = "1";
        $("status").textContent = out.length + " characters, " + Math.round(performance.now() - t0) + " ms";
    } catch (err) {
        $("output").value = "";
        $("status").textContent = "Error: " + err.message;
    }
}

/** the edited fields back into the entry */
function applyEdits() {
    const e = book[current];
    e.title = $("title").value;
    e.input = $("input").value;
    e.recipe = Utils.parseRecipeConfig($("recipe").value);
    show(current);
}

/** a CyberChef link (the main app's #recipe=...&input=...) as a new entry */
function addFromLink() {
    const link = window.prompt("Paste a CyberChef link (with #recipe= and optionally &input=):");
    if (!link) return;
    const frag = link.slice(link.indexOf("#") + 1);
    const params = new URLSearchParams(frag.replace(/\+/g, "%2B"));
    const recipe = Utils.parseRecipeConfig(params.get("recipe") || "");
    let input = "";
    if (params.get("input")) {
        try {
            input = decodeURIComponent(escape(atob(params.get("input"))));
        } catch (e) {
            input = params.get("input");
        }
    }
    book.push({title: "Recipe " + (book.length + 1), input: input, recipe: recipe});
    show(book.length - 1);
}

window.addEventListener("DOMContentLoaded", () => {
    book = loadBook();
    const pm = window.location.hash.match(/page=(\d+)/);
    $("apply").onclick = applyEdits;
    $("add").onclick = addFromLink;
    $("remove").onclick = () => {
        if (book.length > 1) {
            book.splice(current, 1);
            show(Math.min(current, book.length - 1));
        }
    };
    $("up").onclick = () => {
        if (current > 0) {
            [book[current - 1], book[current]] = [book[current], book[current - 1]];
            show(current - 1);
        }
    };
    $("prev").onclick = () => show(current - 1);
    $("nextb").onclick = () => show(current + 1);
    $("copy").onclick = () => navigator.clipboard.writeText(window.location.href);
    document.addEventListener("keydown", ev => {
        if (ev.target.tagName === "TEXTAREA" || ev.target.tagName === "INPUT") return;
        if (ev.key === "ArrowDown" || ev.key === "j") show(current + 1);
        if (ev.key === "ArrowUp" || ev.key === "k") show(current - 1);
    });
    show(pm ? parseInt(pm[1], 10) - 1 : 0);
});

window.puzzlesBook = {get book() {
    return book;
}, show: show, bake: (input, recipe) => chef.bake(input, recipe)};
