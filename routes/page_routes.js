const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000  },
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image');

// Check file type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// Home Route
router.get('/', async (req, res) => {
    const pages = await Page.find({});
    if (pages.length === 0) {
        return res.redirect('/login');
    } else {
        return res.redirect(`/${pages[0]._id}`);
    }
});

//Admin route
router.get('/admin', (req, res) => {
    if (!req.session.isLoggedIn) {
        req.session.error_msg = 'Please log in to view that resource';
        return res.redirect('/login');
    }
    res.render('admin/dashboard');
});

//GET Add page
router.get('/admin/add-page', (req, res) => {
    if (!req.session.isLoggedIn) {
        req.session.error_msg = 'Please log in to view that resource';
        return res.redirect('/login');
    }
    res.render('admin/add_page');
});

//POST Add page
router.post('/admin/add-page', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.render('admin/add_page', {
                msg: err
            });
        } else {
            if (req.file == undefined) {
                res.render('admin/add_page', {
                    msg: 'Error: No File Selected!'
                });
            } else {
                const { title, content } = req.body;
                const newPage = new Page({
                    title,
                    content,
                    image: `/uploads/${req.file.filename}`
                });
                newPage.save()
                    .then(page => {
                        req.session.success_msg = 'Page added successfully';
                        res.render('admin/add_page_msg');
                    })
                    .catch(err => console.log(err));
            }
        }
    });
});

//edit-pages route
router.get('/admin/edit-pages', async (req, res) => {
    if (!req.session.isLoggedIn) {
        req.session.error_msg = 'Please log in to view that resource';
        return res.redirect('/login');
    }
    const pages = await Page.find({});
    res.render('admin/edit_pages', { pages });
});

//GET edit page
router.get('/admin/edit-page/:id', async (req, res) => {
    if (!req.session.isLoggedIn) {
        req.session.error_msg = 'Please log in to view that resource';
        return res.redirect('/login');
    }
    const page = await Page.findById(req.params.id);
    res.render('admin/edit_page', { page });
});

// POST Edit Page
router.post('/admin/edit-page/:id', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.render('admin/edit_page', {
                page: req.body,
                msg: err
            });
        } else {
            if (req.file == undefined) {
                // No file was uploaded
                const { title, content } = req.body;
                try {
                    const page = await Page.findById(req.params.id);
                    page.title = title;
                    page.content = content;

                    await page.save();
                    req.session.success_msg = 'Page updated successfully';
                    res.render('admin/edit_msg');
                } catch (err) {
                    console.error(err);
                    res.render('admin/edit_page', {
                        page: req.body,
                        msg: 'Error updating page'
                    });
                }
            } else {
                // File was uploaded
                const { title, content } = req.body;
                const imagePath = `/uploads/${req.file.filename}`;
                try {
                    const page = await Page.findById(req.params.id);
                    page.title = title;
                    page.content = content;
                    page.image = imagePath;

                    await page.save();
                    req.session.success_msg = 'Page updated successfully';
                    res.render('admin/edit_msg');
                } catch (err) {
                    console.error(err);
                    res.render('admin/edit_page', {
                        page: req.body,
                        msg: 'Error updating page'
                    });
                }
            }
        }
    });
});

//Delete page route
router.get('/admin/delete-page/:id', async (req, res) => {
    if (!req.session.isLoggedIn) {
        req.session.error_msg = 'Please log in to view that resource';
        return res.redirect('/login');
    }
    await Page.findByIdAndDelete(req.params.id);
    req.session.success_msg = 'Page deleted successfully';
    res.render('admin/delete_msg');
});

// Login Route
router.get('/login', async (req, res) => {
    const pages = await Page.find({});
    res.render('login', { pages });
});

// Handle login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check for username and password
    if (username === 'admin' && password === 'admin') {
        req.session.isLoggedIn = true;
        req.session.isAdmin = true; 
        req.session.success_msg = 'Login successful';
        res.redirect('/admin');
    } else {
        req.session.error_msg = 'Invalid username or password';
        res.redirect('/login');
    }
});

// Handle logout
router.get('/admin/logout', async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        
        
    });
    const pages = await Page.find({});
    res.render('logout', { pages });
});


// Display dynamic pages
router.get('/:id', async (req, res) => {
    const page = await Page.findById(req.params.id);
    const pages = await Page.find({});
    if (!page) {
        return res.redirect('/');
    }
    res.render('page', { page, pages });
});

module.exports = router;
