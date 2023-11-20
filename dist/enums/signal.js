"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    /**
     * @server
     * @summary Successfully logged into the server
     * @params the uuid of current player
     */
    UUID: '$UUID',
    /**
     * @server
     * @summary When someone joined the room
     * @param uuid the uuid of the player whom joined
     */
    JOIN: '$JOIN',
    /**
     * @server
     * @summary When someone left the room
     * @param uuid the uuid of the player whom left
     */
    LEAVE: '$LEAVE',
    /**
     * @server
     * @summary When the match starts
     * @param level the level of the game
     * @param text the text of the puzzle
     * @param time the time limit of the game
     *
     * @client
     * @summary Request the server to start a match
     * @param level the level requested
     */
    MATCH: '$MATCH',
    /**
     * @server
     * @summary Game ended.
     * @param interrupted is the game got interrupted
     * @param score player scores
     */
    RESULT: '$RESULT',
};
