/**
 * @author WolframInstitute/Puzzles
 * @license Apache-2.0
 */

import Operation from "../Operation.mjs";
import OperationError from "../errors/OperationError.mjs";
import { hill } from "../lib/PuzzlesClassical.mjs";

/**
 * Hill (keyword) operation: the WolframInstitute/Puzzles paclet's HillCipher.
 */
class HillKeyword extends Operation {

    /**
     * HillKeyword constructor
     */
    constructor() {
        super();

        this.name = "Hill Keyword";
        this.module = "Ciphers";
        this.description = "Hill cipher whose n x n key is a WORD of n squared letters: each letter's 0-based place in the alphabet (a keyword alphabet such as KRYPTOS, or empty for A-Z), filled row by row; each block of n letters is a column vector b sent to K.b mod 26 (the inverse key to decrypt). A trailing partial block is left as it is; non-letters and case stay in place. A matrix may be given instead as rows separated by ';'. Identical to the WolframInstitute/Puzzles paclet's HillCipher.";
        this.infoURL = "https://en.wikipedia.org/wiki/Hill_cipher";
        this.inputType = "string";
        this.outputType = "string";
        this.args = [
            {name: "Mode", type: "option", value: ["Decrypt", "Encrypt"]},
            {name: "Key word", type: "string", value: ""},
            {name: "Alphabet keyword", type: "string", value: "KRYPTOS"}
        ];
    }

    /**
     * @param {string} input
     * @param {Object[]} args
     * @returns {string}
     */
    run(input, args) {
        const [mode, key, alphabet] = args;
        if (!key.trim()) throw new OperationError("Enter a key word.");
        try {
            return hill(input, key, mode, alphabet);
        } catch (e) {
            throw new OperationError(e.message);
        }
    }
}

export default HillKeyword;
