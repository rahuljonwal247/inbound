
const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    storageType:{ type: String, required: true },
    storageSection:{ type: String, required: true },
    binNumber: { type: String, required: true },
    binCapacity: { type: String, required: true },
    digitCode:{ type: String, required: true },
    SKU_Code: { type: String, required: true },
    batch: { type: String, required: true },
    usedCapacity: { type: String, required: true },
});

module.exports = mongoose.model('Bin', binSchema);
