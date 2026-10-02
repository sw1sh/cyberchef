/**
 * @author WolframInstitute/Puzzles
 * @license Apache-2.0
 */

import Operation from "../Operation.mjs";
import OperationError from "../errors/OperationError.mjs";
import { gridRoute } from "../lib/PuzzlesClassical.mjs";

/**
 * Grid Route operation: the WolframInstitute/Puzzles paclet's TranspositionFamily "Route".
 */
class GridRoute extends Operation {

    /**
     * GridRoute constructor
     */
    constructor() {
        super();

        this.name = "Grid Route";
        this.module = "Ciphers";
        this.description = "Route transposition on a grid: the text written row by row into Rows x Columns cells, the grid turned or flipped (Rows = as written, Columns = transposed, Rotate90/180/270 = clockwise turns, FlipRows, FlipColumns, AntiTranspose), then read off by a pattern: rows, boustrophedon, columns, column boustrophedon, a clockwise spiral inward (SpiralIn) or outward, or the diagonals. A clockwise spiral from the top-right corner down the right edge is Rotate270 + SpiralIn. Every character is a cell. Identical to the WolframInstitute/Puzzles paclet's TranspositionFamily[\"Route\", ...].";
        this.infoURL = "https://en.wikipedia.org/wiki/Transposition_cipher#Route_cipher";
        this.inputType = "string";
        this.outputType = "string";
        this.args = [
            {name: "Mode", type: "option", value: ["Decrypt", "Encrypt"]},
            {name: "Rows", type: "number", value: 12},
            {name: "Columns", type: "number", value: 12},
            {name: "Symmetry", type: "option", value: ["Rows", "Columns", "Rotate90", "Rotate180", "Rotate270", "FlipRows", "FlipColumns", "AntiTranspose"]},
            {name: "Pattern", type: "option", value: ["SpiralIn", "SpiralOut", "Rows", "Boustrophedon", "Columns", "ColumnBoustrophedon", "Diagonals", "AntiDiagonals"]}
        ];
    }

    /**
     * @param {string} input
     * @param {Object[]} args
     * @returns {string}
     */
    run(input, args) {
        const [mode, rows, cols, symmetry, pattern] = args;
        try {
            return gridRoute(input, rows, cols, symmetry, pattern, mode);
        } catch (e) {
            throw new OperationError(e.message);
        }
    }
}

export default GridRoute;
