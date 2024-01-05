const express = require('express');
const expressLayouts = require('express-ejs-layouts');

const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

const { body, validationResult, check } = require('express-validator');

var methodOverride = require('method-override')

require('./utils/db');
const Contact = require('./model/contact');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'))

app.use(cookieParser('secret'));
app.use(session({
    cookie: {maxAge: 6000},
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(flash());

app.get('/', (req, res) => {
    const mahasiswa = [
        {
            nama: 'Rama',
            email: 'rama@gmail.com'
        },
        {
            nama: 'Dos',
            email: 'rama@gmail.com'
        },
        {
            nama: 'Win',
            email: 'rama@gmail.com'
        },
    ]
    res.render('index', {
        nama: 'Rama',
        title: 'Index',
        mahasiswa,
        layout: 'layouts/main-layout'
    });
});

app.get('/about', (req, res, next) => {
    res.render('about', {
        title: 'About',
        layout: 'layouts/main-layout'
    });
});

app.get('/contact', async (req, res) => {
    
    const contacts = await Contact.find();
    res.render('contact',{
        title: 'Contact',
        layout: 'layouts/main-layout',
        contacts,
        msg: req.flash('msg')
    });
});

app.get('/contact/add', (req, res) => {
    res.render('add-contact', {
        title: 'Add Contact',
        layout: 'layouts/main-layout',
    });
});

app.post('/contact', [
    check('email', 'Email tidak valid!').isEmail(), 
    check('nomor', 'No. HP tidak valid!').isMobilePhone('id-ID'),
    body('nama').custom(async (value) => {
        const duplikat = await Contact.findOne({nama: value});
        if(duplikat){
            throw new Error('Nama contact sudah digunakan!');
        }
        return true;
    })
    ], (req, res) => {
        const err = validationResult(req);
        if(!err.isEmpty()){
            res.render('add-contact', {
                title: 'Add Contact',
                layout: 'layouts/main-layout',
                err: err.array()
            });
        } else {
            Contact.insertMany(req.body);
            req.flash('msg', 'Contact berhasil ditambahkan!');
            res.redirect('/contact');
        }
});

app.delete('/contact', (req, res) => {
    Contact.deleteOne({nama: req.body.nama}).then((result) => {
        req.flash('msg', 'Contact berhasil dihapus!');
        res.redirect('/contact');
    });
});

app.get('/contact/edit/:nama', async (req, res) => {
    const contact = await Contact.findOne({nama: req.params.nama});

    res.render('edit-contact', {
        title: 'Edit Data',
        layout: 'layouts/main-layout',
        contact
    });
});

app.put('/contact', [
    check('email', 'Email tidak valid!').isEmail(), 
    check('nomor', 'No. HP tidak valid!').isMobilePhone('id-ID'),
    body('nama').custom(async (value, {req}) => {
        const duplikat = await Contact.findOne({nama: value});
        if(value !== req.body.oldNama && duplikat){
            throw new Error('Nama contact sudah digunakan!');
        }
        return true;
    })
    ], (req, res) => {
    const err = validationResult(req);
    
    if(!err.isEmpty()){
        res.render('edit-contact', {
            title: 'Edit Data',
            layout: 'layouts/main-layout',
            contact: req.body,
            err: err.array()
        })
    } else {
        Contact.updateOne(
            {_id: req.body._id}, 
            {$set: 
                {
                    nama: req.body.nama,
                    email: req.body.email,
                    nomor: req.body.nomor
                }
            }).then((result) => {
                req.flash('msg', 'Contact berhasil diubah!');
                res.redirect('/contact');
            });
    }
});

app.get('/contact/:nama', async (req, res) => {
    const contact = await Contact.findOne({ nama: req.params.nama });
    res.render('detail',{
        title: 'Detail Contact',
        layout: 'layouts/main-layout',
        contact
    });
});

app.listen(port, () => {
    console.log(`Mongo Contact App | Listening at http:://localhost:${port}`);
});