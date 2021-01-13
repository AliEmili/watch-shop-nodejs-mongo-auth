const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const shopModel = require('./model/watch');
const userModel = require('./model/user');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const auth = require('./auth');
const jwtDecode = require('jwt-decode');

const PORT = process.env.PORT;

const duplicateUsers = async(username) => {
    try {
        const data = await userModel.find({ username })
        console.log('duplicateUserFunction', data);
        return data
    } catch (err) {
        console.log(err)
        throw err
    }
}

mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', () => {
    const app = express();
    app.use(cors());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(express.static('public'));
    app.set('view engine', 'ejs');
    app.set('views', 'views');
    const fileOpt = require('./multer');
    console.log('connected to database');

    app.get('/', (req, res) => {
        res.render('index');
    });

    app.get('/store', (req, res) => {
        shopModel.find({}, (err, data) => { res.render('store', { productData: data }); });
    });

    app.get('/about-us', (req, res) => {
        res.render('about-us');
    });

    app.get('/newest', (req, res) => {
        res.render('newest');
    });

    app.get('/blog', (req, res) => {
        res.render('blog');
    });

    app.get('/pages', (req, res) => {
        res.render('pages');
    });

    app.get('/contact-us', (req, res) => {
        res.render('contact-us');
    });

    app.get('/edit/:id', (req, res) => {
        const { id } = req.params;
        shopModel.find({ id }, (err, data) => {
            res.render('edit', { data: data[0] })
        });
    });

    app.get('/sign-up', (req, res) => {
        res.render('sign-up');
    });

    app.get('/sign-in', (req, res) => {
        res.render('sign-in');
    })

    app.post('/login', async(req, res) => {
        const { username, password } = req.body
        try {
            const user = await auth.authenticate(username, password)
            const secret = 'mySecret';
            const usernamePayload = user.username;
            const token = jwt.sign({ usernamePayload }, secret);
            const { iat, exp } = jwt.decode(token);
            res.send({ Message: 'Valid User', iat, exp, token });
        } catch (err) {
            console.log(err)
            res.send({
                Message: 'User is not valid!'
            })
        }
    });

    app.post('/sign-up', async(req, res) => {
        const { username, password } = req.body;
        console.log(req.body);
        const user = new userModel({
            username,
            password
        });
        // check for existing users
        let data = await duplicateUsers(username);
        if (data.length === 0) {
            bcrypt.genSalt(10, (error, salt) => {
                if (error) throw error
                bcrypt.hash(password, salt, async(err, hash) => {
                    if (err) throw err
                    console.log('first hashed');
                    console.log(hash);
                    user.password = hash;
                    try {
                        const data = await user.save();
                        console.log(data);
                        console.log('Data inserted!');
                        res.json({
                            Message: 'Signup completed.'
                        })
                    } catch (err) {
                        console.log(err)
                        res.send('Err')
                    }
                })
            })
        } else if (data.length > 0) {
            res.send({
                Message: 'Users exists!'
            })
        }
    })

    app.post('/store', fileOpt.Upload.single('picture'), async(req, res) => {
        const { title, price, token } = req.body;
        try {
            if (token) {
                const decodedToken = jwtDecode(token);
                if (decodedToken) {
                    let imagePath = req.file.path;
                    const slashIndex = imagePath.indexOf('/');
                    imagePath = imagePath.substr(slashIndex, imagePath.length);
                    if (title && price && imagePath) {
                        const newData = new shopModel({
                            id: parseInt(Math.random().toString().substr(2, 5)),
                            title,
                            price,
                            link: imagePath
                        })
                        const result = await newData.save();
                        res.json(result).status(200);
                    }
                }
            }
        } catch (err) {
            res.json(err);
        }
    });

    app.post('/api/edit/:id', fileOpt.Upload.single('picture'), async(req, res) => {
        const { id } = req.params;
        let { title, price, token } = req.body;
        try {
            if (token) {
                const decodedToken = jwtDecode(token);
                if (decodedToken) {
                    shopModel.find({ id }, (err, data) => {
                        const prevData = data[0]
                        let imagePath;
                        if (req.file) {
                            imagePath = req.file.path;
                            const slashIndex = imagePath.indexOf('/');
                            imagePath = imagePath.substr(slashIndex, imagePath.length);
                        }
                        if (!title) {
                            title = prevData.title;
                        }
                        if (!price) {
                            price = prevData.price;
                        }
                        if (!imagePath) {
                            imagePath = prevData.link
                        }
                        shopModel.updateOne({ id }, { $set: { title, price, link: imagePath } }, (err, data) => {
                            if (err) {
                                console.log(err)
                            } else {
                                res.json(data).status(200);
                            }
                        })
                    });
                }
            }
        } catch (err) {
            res.json(err);
        }
    })

    app.delete('/store/:id', (req, res) => {
        const { id } = req.params;
        const token = req.get('token');
        try {
            if (token) {
                const decodedToken = jwtDecode(token);
                if (decodedToken) {
                    shopModel.deleteOne({ id }, (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            res.json(result).status(200);
                        }
                    })
                }
            }
        } catch (err) {
            res.json(err);
        }
    });

    app.listen(PORT, () => {
        console.log(`> Server started on port: ${PORT}`);
    });
});