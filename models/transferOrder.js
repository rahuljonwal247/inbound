const mongoose = require('mongoose');

const transferOrderSchema = new mongoose.Schema({
    transferOrder: { type: String },
    date: { type: Date },
    forkliftOperator: { type: mongoose.Schema.Types.ObjectId, ref: 'ForkliftOperator' },
    skuCode: { type: String },
    skuDesc: { type: String },
    sut: { type: String },
    batch:{ type: String },
    palletQty: { type: String },
    binNumber: { type: String },
    threeDigitCode: { type: String },
    status: { type: String, default: 'Pending' },
    sourceLocation:{ type: String },
    destinationLocation:{ type: String },
});

module.exports = mongoose.model('TransferOrder', transferOrderSchema);
