const express = require('express');
const router = express.Router();
const repo = require('./../repo')

router.get('/', (req, res) => {
    // если пользователь не вошёл, то ставим reqReg - true, чтобы потом использовать в handlebars
    if (!req.user) {
        res.render('contacts', {reqReg: true})
        return
    }
    repo.getContacts(req.user.id)
        .then((data) => {
            res.render('contacts', {contacts: data})
        })
})

router.post('/', (req, res) => {
    if (!req.user) {
        res.redirect('/contacts')
        return
    }

    repo.addMessage(req.user.id, req.body.message)
        .then(() => {
            res.redirect('contacts')
        })
})

module.exports = router
