/**
 * @author WolframInstitute/Puzzles
 * @license Apache-2.0
 */

import Operation from "../Operation.mjs";
import OperationError from "../errors/OperationError.mjs";
import { vigenere } from "../lib/PuzzlesClassical.mjs";

/**
 * Running Key operation: the paclet's VigenereCipher with a whole text as its key.
 */
class RunningKey extends Operation {

    /**
     * RunningKey constructor
     */
    constructor() {
        super();

        this.name = "Running Key";
        this.module = "Ciphers";
        this.description = "Vigenere or Quagmire substitution whose key is a TEXT, as long as the message or longer - another panel's plaintext, a book passage. Put the key text in the field, or capture a previous output with Register and use $R0. Letters only are used from the key. Identical to the WolframInstitute/Puzzles paclet's VigenereCipher with the text as its key.";
        this.infoURL = "https://en.wikipedia.org/wiki/Running_key_cipher";
        this.inputType = "string";
        this.outputType = "string";
        this.args = [
            {name: "Mode", type: "option", value: ["Decrypt", "Encrypt"]},
            {name: "Key text", type: "text", value: ""},
            {name: "Plain alphabet keyword", type: "string", value: "KRYPTOS"},
            {name: "Cipher alphabet keyword", type: "string", value: "KRYPTOS"}
        ];
    }

    /**
     * @param {string} input
     * @param {Object[]} args
     * @returns {string}
     */
    run(input, args) {
        const [mode, keyText, plain, cipher] = args;
        const key = keyText.toUpperCase().replace(/[^A-Z]/g, "");
        if (!key) throw new OperationError("Enter a key text.");
        try {
            return vigenere(input, [key], mode, plain, cipher, "Vigenere");
        } catch (e) {
            throw new OperationError(e.message);
        }
    }
}

export default RunningKey;
