const express = require('express');
const router = express.Router();
const repo = require('./../repo')

function getUserId(req) {
    return req.user ? req.user.id : req.sessionID;
}

router.get('/', function (req, res) {
    console.log('userId:', getUserId(req))
    repo.getCart(getUserId(req))
        .then((data) => {
            console.log(data)
            res.render('cart', {products: data, isEmpty: data.length === 0})
        })
});

router.post('/', function (req, res) {
    let product = req.body;
    if (!product || !product.id) {
        res.status(400).json({error: 'Неверные данные'})
    } else {
        console.log('try add to cart:', getUserId(req), product)
        repo.addToCart(getUserId(req), product.id)
            .then((data) => {
                console.log('added to cart:', data)
                res.json({data: data})
            })
    }
})

router.delete('/', function (req, res) {
    let product = req.body
    console.log(product)
    if (!product || !product.id) {
        res.status(400).json({error: 'Неверные данные'})
    } else {
        console.log('try remove from cart:', getUserId(req), product)
        repo.removeFromCart(getUserId(req), product.id)
            .then((data) => {
                console.log('removed from cart:', data)
                res.send({ok: true})
            })
    }
})

module.exports = router
