var instruments_map = require("./instruments_map.json");

function mapnoteblocks(bot) {
	var result = [];
	for (x = -4; x <= 4; x++) {
		for (y = -4; y <= 4; y++) {
			for (z = -4; z <= 4; z++) {
				var pos = bot.blockAt(bot.entity.position.offset(x, y, z));
				var blockAbove = bot.blockAt(bot.entity.position.offset(x, y + 1, z));

				if (pos.name == "note_block" && (blockAbove.name == "air" || blockAbove.name == "cave_air" || blockAbove.name == "void_air")) {
					var NBInfo = getNoteBlockInfo(pos);
					pos.pitch = NBInfo.pitch == undefined ? 0 : NBInfo.pitch;
					pos.instrumentid = NBInfo.instrumentid == undefined ? 0 : NBInfo.instrumentid;

					result.push(pos);
				}
			}
		}
	}
	return result;
}

// Thanks Quad
function noteblockInfoFromMetadata(metadata) {
	var instrumentid = Math.floor(metadata / 50);
	var pitch;

	if ((metadata % 2) == 0) {
		pitch = metadata / 2;
	} else {
		pitch = ((metadata - 1) / 2) + 1;
	}

	pitch = pitch - instrumentid * 25;
    pitch = pitch - 1;

	var instrument = instruments_map.lowercase[instrumentid];

	return { instrument: instrument, instrumentid: instrumentid, pitch: pitch };

}

function getNoteBlockInfo(block) {
	if (block == null) return console.log("Block was null!");
	if (block.name == null || block.metadata == null) return console.log("Block name or metadata was null!");//should never happend
	if (block.name != "note_block") return console.log("Expected name 'note_block' got " + block.name);

	return noteblockInfoFromMetadata(block.metadata);
}

module.exports = {
	mapnoteblocks,
	getNoteBlockInfo,
	noteblockInfoFromMetadata
};