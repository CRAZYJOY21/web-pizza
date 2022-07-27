const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const repo = require('./repo')

const indexRouter = require('./routes/index');
const cartRouter = require('./routes/cart');
const orderRouter = require('./routes/order');
const adminRouter = require('./routes/admin');
const contactsRouter = require('./routes/contacts');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: {
        path: '/',
        maxAge: 900000
    }
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
        usernameField: 'id',
        passwordField: 'password',
    },
    function (username, password, done) {
        repo.findUser(username)
            .then((user) => {
                if (user && user.password === password) {
                    done(null, user)
                } else {
                    return done(null, false)
                }
                console.log("user in repo: ", user)
            })
    }
));

passport.serializeUser(function (user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
    repo.findUser(id)
        .then((user) => {
            cb(null, user);
        })
});

app.use('/', indexRouter)
app.use('/cart', cartRouter)
app.use('/order', orderRouter)
app.use('/admin', adminRouter)
app.use('/contacts', contactsRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
