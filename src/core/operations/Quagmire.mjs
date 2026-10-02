/**
 * @author WolframInstitute/Puzzles
 * @license Apache-2.0
 */

import Operation from "../Operation.mjs";
import OperationError from "../errors/OperationError.mjs";
import { vigenere, keyWords } from "../lib/PuzzlesClassical.mjs";

/**
 * Quagmire operation: the WolframInstitute/Puzzles paclet's VigenereCipher.
 */
class Quagmire extends Operation {

    /**
     * Quagmire constructor
     */
    constructor() {
        super();

        this.name = "Quagmire";
        this.module = "Ciphers";
        this.description = "Periodic substitution over keyed alphabets, every key a WORD: the Quagmire I-IV family (plain alphabet keyword / cipher alphabet keyword; the same word on both sides is Quagmire III, empty means A-Z) and plain Vigenere (both empty). Several key words, separated by spaces or commas, are SUMMED (one pass each, undone in reverse to decrypt) - the summed-cycleword Quagmire. Key letters are read in the plaintext alphabet; non-letters pass through without consuming the key; case is kept. Identical to the WolframInstitute/Puzzles paclet's VigenereCipher.";
        this.infoURL = "https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher";
        this.inputType = "string";
        this.outputType = "string";
        this.args = [
            {name: "Mode", type: "option", value: ["Decrypt", "Encrypt"]},
            {name: "Plain alphabet keyword", type: "string", value: "KRYPTOS"},
            {name: "Cipher alphabet keyword", type: "string", value: "KRYPTOS"},
            {name: "Key words", type: "string", value: ""},
            {name: "Variant", type: "option", value: ["Vigenere", "Beaufort", "VariantBeaufort"]}
        ];
    }

    /**
     * @param {string} input
     * @param {Object[]} args
     * @returns {string}
     */
    run(input, args) {
        const [mode, plain, cipher, keyField, variant] = args;
        const keys = keyWords(keyField);
        if (keys.length === 0) throw new OperationError("Enter one or more key words.");
        try {
            return vigenere(input, keys, mode, plain, cipher, variant);
        } catch (e) {
            throw new OperationError(e.message);
        }
    }
}

export default Quagmire;
