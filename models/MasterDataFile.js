// models/MasterDataFile.js
const mongoose = require('mongoose');

const MasterDataFileSchema = new mongoose.Schema({
  productionLine: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model('MasterDataFile', MasterDataFileSchema);

