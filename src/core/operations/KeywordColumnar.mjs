/**
 * @author WolframInstitute/Puzzles
 * @license Apache-2.0
 */

import Operation from "../Operation.mjs";
import OperationError from "../errors/OperationError.mjs";
import { columnar } from "../lib/PuzzlesClassical.mjs";

/**
 * Keyword Columnar operation: the WolframInstitute/Puzzles paclet's ColumnarTransposition.
 */
class KeywordColumnar extends Operation {

    /**
     * KeywordColumnar constructor
     */
    constructor() {
        super();

        this.name = "Keyword Columnar";
        this.module = "Ciphers";
        this.description = "Columnar transposition keyed by a WORD (or a column order such as 3,1,2): the text written row by row in as many columns as the key has letters, the short last row on the left, and read out column by column in the key's plain A-Z order (ties left to right), each column top to bottom or bottom to top. Every character is a cell. Decrypt inverts it. Identical to the WolframInstitute/Puzzles paclet's ColumnarTransposition.";
        this.infoURL = "https://en.wikipedia.org/wiki/Transposition_cipher#Columnar_transposition";
        this.inputType = "string";
        this.outputType = "string";
        this.args = [
            {name: "Mode", type: "option", value: ["Decrypt", "Encrypt"]},
            {name: "Key word", type: "string", value: ""},
            {name: "Column direction", type: "option", value: ["TopToBottom", "BottomToTop"]}
        ];
    }

    /**
     * @param {string} input
     * @param {Object[]} args
     * @returns {string}
     */
    run(input, args) {
        const [mode, key, direction] = args;
        if (!key.trim()) throw new OperationError("Enter a key word.");
        try {
            return columnar(input, key, mode, direction);
        } catch (e) {
            throw new OperationError(e.message);
        }
    }
}

export default KeywordColumnar;
