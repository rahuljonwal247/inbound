const mongoose = require('mongoose');

const skuSchema = new mongoose.Schema({
    skuCode: { type: String, required: true },
    skuDesc: String,
    sut: String,
    skuGrp: String, // SKU Group
    ssi: String, // SSI
});

module.exports = mongoose.model('SKU', skuSchema);
