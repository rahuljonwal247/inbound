const mongoose = require('mongoose');

const forkliftOperatorSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
});

module.exports = mongoose.model('ForkliftOperator', forkliftOperatorSchema);
