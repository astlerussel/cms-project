const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: false, // Make it optional
    },
});

const Page = mongoose.model('Page', PageSchema);

module.exports = Page;
