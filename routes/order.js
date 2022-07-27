const express = require('express');
const router = express.Router();
const repo = require('./../repo')

function getUserId(req) {
    return req.user ? req.user.id : req.sessionID;
}

function makeOrderRes(user, data, req) {
    if (data.length === 0) {
        return {};
    }

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        data[i].price = Number.parseFloat(data[i].price)
        sum += data[i].price
    }

    let more = false;

    if (data.length > 7) {
        data = data.slice(7);
        more = true;
    }

    return {products: data, user: req.user, more: more, priceSum: sum}
}

router.get('/', function (req, res) {
    const userId = getUserId(req)

    repo.getUser(userId)
        .then((user) => {
            console.log(user)
            repo.getCart(userId)
                .then((data) => {
                    let result = makeOrderRes(user, data, req, res)

                    if (!user) {
                        user = {}
                    }

                    result.orderData = {
                        name: user.name,
                        id: user.id,
                        phone: user.phone,
                        address: user.address
                    }

                    console.log(result.orderData)

                    res.render('order', result)
                })
        })
})

router.post('/', function (req, res) {
    const userId = getUserId(req)
    let orderData = req.body

    console.log(orderData)

    repo.getUser(userId)
        .then((user) => {
            console.log(user)
            repo.getCart(userId)
                .then((data) => {
                    let result = makeOrderRes(data, req, res)

                    if (user && user.id) {
                        orderData.id = user.id
                    }

                    let isError = false
                    result.err = {}
                    if (!orderData.name) {
                        result.err.name = true
                        isError = true
                    }
                    if (!orderData.id) {
                        result.err.id = true
                        isError = true
                    }
                    if (!orderData.phone) {
                        result.err.phone = true
                        isError = true
                    }
                    if (!orderData.address) {
                        result.err.address = true
                        isError = true
                    }

                    if (typeof orderData.accept === 'undefined') {
                        result.err.accept = true
                        isError = true
                    }
                    if (isError) {
                        result.orderData = orderData

                        res.render('order', result)
                        return
                    }


                    if (!user) {
                        repo.addOrder(userId, orderData.name, orderData.id, orderData.phone, orderData.address, orderData.comment)
                            .then(() => {
                                res.redirect('/order/success')
                            })
                        return;
                    }

                    user.name = orderData.name
                    user.phone = orderData.phone
                    user.address = orderData.address

                    repo.updateUser(user)
                        .then(() => {
                            repo.addOrder(userId, orderData.name, orderData.id, orderData.phone, orderData.address, orderData.comment)
                                .then(() => {
                                    res.redirect('/order/success')
                                })
                        })
                })
        })
})

router.get('/success', function (req, res) {
    res.render('order-final', {user: req.user})
})

module.exports = router
