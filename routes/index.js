const express = require('express');
const router = express.Router();
const passport = require('passport');
const repo = require('./../repo')
const roles = require('./../roles')

router.get('/', function (req, res, next) {
    console.log("session", req.sessionID)
    console.log("user", req.user)

    repo.getProducts()
        .then((products) => {

            let groups = []
            let groupProducts = []

            for (let i = 0; i < products.length; i++) {
                console.log('product, id =', products[i].id)
                if (i % 3 === 0 && i > 0) {
                    console.log('add, i =', i)
                    groups.push({products: groupProducts})
                    groupProducts = []
                }
                groupProducts.push(products[i])
            }

            if (groupProducts.length > 0) {
                groups.push({products: groupProducts})
            }

            console.log(groups)

            res.render('index', {title: 'Express', user: req.user, products: products, groups: groups});
        })
});

router.post('/login', function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({error: 'Неверный логин или пароль'});
        }
        if (user.role !== roles.Customer) {
            return  res.status(403).json({error: 'Доступ запрещён'});
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            return res.json({
                user: user
            });
        });
    })(req, res, next);
});

router.post('/register', function (req, res, next) {
    var user = req.body;
    console.log("reg. user:", user)
    if (user.id && user.password && user.passwordConfirm) {
        if (user.password !== user.passwordConfirm) {
            res.status(400).send({error: "Пароли не совпадают"})
        } else {
            repo.createUser(user.id, user.password).then(() => {
                console.log("added user:", user)
                req.logIn(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.json({
                        user: user
                    });
                })
            }).catch((err) => {
                console.log(JSON.stringify(err))
                res.status(400).send({error: "Пользователь уже существует"})
            })
        }
    } else {
        res.status(400).send({error: 'Введите данные'})
    }
});

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;
