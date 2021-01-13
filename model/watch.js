const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    }
}, { collection: 'collection' });

const shopModel = mongoose.model('shopModel', shopSchema);

module.exports = shopModel;