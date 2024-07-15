
const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
   skuGrp:String,
   ssi:String,
   storageSecA:String,
   storageSecB:String,
});

module.exports = mongoose.model('Section', sectionSchema);
