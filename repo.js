const sqlite3 = require("sqlite3");
const dateFormat = require("dateformat");

// Data Access Object
// (Класс доступа к БД - "клиент для для взаимодействия с БД)
class Dao {
    constructor(dbFilePath) {
        this.db = new sqlite3.Database(dbFilePath, (err) => {
            if (err) {
                console.log("Database not found", err)
            } else {
                console.log("connected to db")
            }
        })
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.log('Error running sql ' + sql)
                    console.log(err)
                    reject(err)
                } else {
                    resolve({id: this.lastID})
                }
            })
        })
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if (err) {
                    console.log('Error running sql: ' + sql)
                    console.log(err)
                    reject(err)
                } else {
                    resolve(result)
                }
            })
        })
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.log('Error running sql: ' + sql)
                    console.log(err)
                    reject(err)
                } else {
                    resolve(rows)
                }
            })
        })
    }
}

class Repository {
    constructor(dao) {
        this.dao = dao
    }

    createTables() {
        const sqlUsers = `
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY,
          password VARCHAR NOT NULL,
          role VARCHAR NOT NULL,
          name VARCHAR NULL,
          phone VARCHAR NULL,
          address VARCHAR NULL
        )
        `
        const sqlProducts = `
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR NOT NULL,
          description VARCHAR NULL,
          price REAL NOT NULL
        )
        `
        const sqlCart = `
        CREATE TABLE IF NOT EXISTS cart (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId VARCHAR NOT NULL,
          productId INTEGER NOT NULL
        )
        `
        const sqlOrders = `
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId VARCHAR NOT NULL,
          status VARCHAR NOT NULL DEFAULT('NEW'),
          name VARCHAR NOT NULL,
          email VARCHAR NOT NULL,
          phone VARCHAR NOT NULL,
          address VARCHAR NOT NULL,
          comment VARCHAR NULL
        )
        `
        const sqlOrderProducts = `
        CREATE TABLE IF NOT EXISTS orderProducts (
          orderId INTEGER NOT NULL,
          productId INTEGER NOT NULL
        )
        `
        const sqlContacts = `
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId VARCHAR NOT NULL,
            message VARCHAR NOT NULL,
            reply VARCHAR NULL
        )
        `

        return this.dao.run(sqlUsers)
            .then(() => this.dao.run(sqlCart))
            .then(() => this.dao.run(sqlProducts))
            .then(() => this.dao.run(sqlOrders))
            .then(() => this.dao.run(sqlOrderProducts))
            .then(() => this.dao.run(sqlContacts))
    }

    findUser(id) {
        return this.dao.get('SELECT * FROM users WHERE id = ?', [id])
    }

    createUser(id, password) {
        return this.dao.run(`
        INSERT INTO users (id, password, role) VALUES (?, ?, 'CUSTOMER')
        `, [id, password])
    }

    getUser(userId) {
        return this.dao.get('SELECT * FROM users WHERE id = ?', [userId])
    }

    getUsers() {
        return this.dao.all(`SELECT * FROM users WHERE role = 'CUSTOMER'`)
            .then((users) => {
                for (let i = 0; i < users.length; i++) {
                    users[i].num = i + 1;
                }

                return users;
            })
    }

    updateUser(user) {
        const sql = `
        UPDATE users
        SET name = ?, phone = ?, address = ?
        WHERE id = ?
        `

        return this.dao.run(sql, [user.name, user.phone, user.address, user.id])
    }

    getCart(userId) {
        const sql = `
        SELECT c.id, p.name, p.description, p.price
        FROM cart c LEFT OUTER JOIN products p
          ON p.id = c.productId
        WHERE c.userId = ?
        `

        return this.dao.all(sql, [userId])
            .then((data) => {
                for (let i = 0; i < data.length; i++) {
                    data[i].num = i + 1
                }
                return data
            })
    }

    addToCart(userId, productId) {
        const sql = `
        INSERT INTO cart (userId, productId)
        VALUES (?, ?)
        `
        return this.dao.run(sql, [userId, productId])

    }

    removeFromCart(userId, cartId) {
        return this.dao.run('DELETE FROM cart WHERE userId = ? AND id = ?', [userId, cartId])
    }

    getProducts() {
        return this.dao.all('SELECT * FROM products')
            .then((products) => {
                for (let i = 0; i < products.length; i++) {
                    products[i].num = i + 1;
                }
                return products;
            })
    }

    addOrder(userId, name, email, phone, address, comment) {
        const sqlAddOrders = `
        REPLACE INTO orders (userId, name, email, phone, address, comment)
        VALUES (?, ?, ?, ?, ?, ?)
        `

        const sqlAddOrderProducts = `
        INSERT INTO orderProducts (orderId, productId)
        SELECT ?, productId FROM cart WHERE userId = ?
        `

        return this.dao.run(sqlAddOrders, [userId, name, email, phone, address, comment])
            .then((order) => {
                return this.dao.run(sqlAddOrderProducts, [order.id, userId])
                    .then(() => {
                         return this.dao.run('DELETE FROM cart WHERE userId = ?', [userId])
                    })
            })
    }

    getOrders(status) {
        let sql = `
        SELECT o.id, o.name, o.email, o.phone, o.address, o.comment, ifnull(pp.price, 0) price, o.status, o.timestamp
        FROM orders o LEFT OUTER JOIN users u
          ON o.userId = u.id LEFT OUTER JOIN
          (SELECT op.orderId, SUM(p.price) price
           FROM orderProducts op LEFT OUTER JOIN products p
            ON p.id = op.productId
            GROUP BY op.orderId) pp
            ON pp.orderId = o.id
        `

        if (status) {
            sql = sql + ` WHERE status = '` + status + `'`
        }

        return this.dao.all(sql)
            .then((orders) => {
                for (let i = 0; i < orders.length; i++) {
                    let o = orders[i]

                    o.num = i + 1;
                    o.completed = o.status === 'COMPLETED' || o.status === 'CANCELED';
                    o.canceled = o.status === 'CANCELED';
                    //o.timestamp = dateFormat(new Date(), "h:MM:ss dd-mm-yyyy");

                    if (o.status === 'COOKING') {
                        o.statusName = 'Приготовление'
                    } else if (o.status === 'DELIVERY') {
                        o.statusName = 'Доставка'
                    } else  if (o.status === 'COMPLETED') {
                        o.statusName = 'Завершён'
                    } else  if (o.status === 'CANCELED') {
                        o.statusName = 'Отменён'
                    } else {
                        o.statusName = 'В ожидании'
                    }
                }
                return orders;
            })
    }

    updateOrder(id, status) {
        const sql = `
        UPDATE orders
        SET status = ?
        WHERE id = ?
        `
        return this.dao.run(sql, [status, id])
    }

    getContacts(userId) {
        return this.dao.all(`SELECT * FROM contacts WHERE userId = ? ORDER BY id DESC`, [userId])
    }

    getMessage(messageId) {
        return this.dao.get(`SELECT * FROM contacts WHERE id = ?`, [messageId])
    }

    addMessage(userId, message) {
        const sql = `
        INSERT INTO contacts (userId, message, timestamp)
        VALUES (?, ?, datetime('now'))
        `

        return this.dao.run(sql, [userId, message])
    }

    replyMessage(messageId, reply) {
        return this.dao.run(`UPDATE contacts SET reply = ? WHERE id = ?`, [reply, messageId])
    }
}

const dao = new Dao('./database.sqlite3')
const repo = new Repository(dao)

repo
    .createTables()
    .catch((err) => {
        console.log("Error:")
        console.log(JSON.stringify(err))
    })

module.exports = repo
