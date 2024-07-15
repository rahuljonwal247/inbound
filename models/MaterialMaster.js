const mongoose = require('mongoose');

const MaterialMasterSchema = new mongoose.Schema({
  SKU_Code: {
    type: Number,
    required: true,
  },
  skuDesc: {
    type: String,
    required: true,
  },
  sut: {
    type: String,
    required: true,
  },
  warehouseCode: {
    type: String,
    required: true,
  },
  itemType: {
    type: String,
    required: true,
  },
  storageType: {
    type: String,
    required: true,
  },
  vendorNo: {
    type: String,
    required: true,
  },
  customerCode: {
    type: String,
    required: true,
  },
  whCode: {
    type: String,
    required: true,
  },
  skuDescription: {
    type: String,
    required: true,
  },
  itemLife: {
    type: String,
    required: true,
  },
  sutQty: {
    type: Number,
    required: true,
  },
  PALLET_QTY: {
    type: Number,
    required: true,
  },
  subCategory: {
    type: String,
    required: true,
  },
  skuGrp: {
    type: Number,
    required: true,
  },
  ssi: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('MaterialMaster', MaterialMasterSchema);
