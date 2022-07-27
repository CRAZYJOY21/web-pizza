const express = require('express');
const router = express.Router();
const repo = require('./../repo')
const roles  = require('./../roles')
const passport = require('passport')

const layout = 'admin/layout.hbs';

function authorize(allowedRole) {
    return function(req, res, next) {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            console.log('NO AUTH!')
            return res.redirect('/admin/login')
        }

        if (req.user.role === roles.Customer) {
            return res.redirect('/')
        }

        if (allowedRole !== roles.Any && req.user.role !== allowedRole) {
            console.log('FORBIDDEN')
            return res.redirect('/admin/forbidden')
        }

        next()
    }
}

router.get('/forbidden', authorize('ANY'), (req, res) => {
    res.render('admin/forbidden', {layout: layout})
})

router.get('/login', function (req, res) {
    res.render('admin/login', {layout: null})
})

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/admin/login');
})

router.post('/login', function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user || user.role === roles.Customer) {
            return res.render('admin/login', {layout: null, error: 'неверный логин или пароль!'})
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }

            if (user.role === roles.Admin) {
                return res.redirect('/admin')
            }
            return res.redirect('/admin/orders')
        });
    })(req, res, next);
});

router.get('/', authorize(roles.Admin), (req, res) => {
    repo.getUsers()
        .then((users) => {
            repo.getProducts()
                .then((products) => {
                    repo.getOrders()
                        .then((orders) => {
                            console.log('USER ROLE = ', req.user.role)
                            res.render('admin/index', {
                                layout: layout,
                                isDashboard: true,
                                users: users,
                                products: products,
                                orders: orders,
                                user: req.user,
                                isAdmin: req.user.role === roles.Admin
                            })
                        })
                })
        })
})

router.get('/users', authorize(roles.Any), function (req, res) {
    repo.getUsers()
        .then((users) => {
            res.render('admin/users', {
                layout: layout,
                isUsers: true,
                users: users,
                user: req.user,
                isAdmin: req.user.role === roles.Admin
            })
        })
})

router.get('/products', authorize(roles.Admin), function (req, res) {
    repo.getProducts()
        .then((products) => {
            res.render('admin/products', {
                layout: layout,
                isProducts: true,
                products: products,
                user: req.user,
                isAdmin: req.user.role === roles.Admin
            })
        })
})

router.get('/orders', authorize(roles.Any), function (req, res) {
    let status = 'NEW'
    if (req.user.role === roles.Cook) {
        status = 'COOKING'
    } else if (req.user.role === roles.Delivery) {
        status = 'DELIVERY'
    } else if (req.user.role === roles.Admin) {
        status = null
    }

    repo.getOrders(status)
        .then((orders) => {
            console.log(orders)
            res.render('admin/orders', {
                layout: layout,
                isOrders: true,
                orders: orders,
                user: req.user,
                isAdmin: req.user.role === roles.Admin
            })
        })
})

router.get('/exec', authorize(roles.Any), (req, res) => {
    let status = 'COOKING'
    if (req.user.role === roles.Cook) {
        status = 'DELIVERY'
    } else if (req.user.role === roles.Delivery) {
        status = 'COMPLETED'
    }

    repo.updateOrder(req.query.id, status)
        .then(() => {
            console.log('order updated:', req.query.id, status)
            res.redirect('/admin/orders')
        })
})

router.get('/cancel', authorize(roles.Admin), (req, res) => {
    repo.updateOrder(req.query.id, 'CANCELED')
        .then(() => {
            res.redirect('/admin/orders')
        })
})

router.get('/contacts', authorize(roles.Manager), (req, res) => {
    repo.getUser(req.query.userId)
        .then((customer) => {
            repo.getContacts(req.query.userId)
            .then((data) => {
                res.render('admin/contacts', {
                    layout: layout,
                    contacts: data,
                    customer: customer,
                    user: req.user,
                    isAdmin: false
                })
            })
        })
})

router.get('/reply', authorize(roles.Manager), (req, res) => {
    repo.getMessage(req.query.messageId)
        .then((message) => {
            console.log('message: ', message)
            repo.getUser(message.userId)
                .then((customer) => {
                    res.render('admin/reply', {
                        layout: layout,
                        message: message,
                        customer: customer,
                        user: req.user,
                        isAdmin: false
                    })
                })
        })
})

router.post('/reply', authorize(roles.Manager), (req, res) => {
    repo.getMessage(req.query.messageId)
        .then((message) => {
            console.log('message: ', message)
            repo.getUser(message.userId)
                .then((user) => {
                    if (!req.body.reply || req.body.reply.length === 0) {
                        res.render('admin/reply', {
                            layout: layout,
                            message: message,
                            user: user,
                            error: true
                        })
                        return
                    }
                    repo.replyMessage(req.query.messageId, req.body.reply)
                        .then(() => {
                            res.redirect('/admin/contacts?userId=' + user.id)
                        })
                })
        })
})

module.exports = router
