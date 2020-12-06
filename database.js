// get the client
const mysql = require('mysql2');
const dotenv = require('dotenv').config();
let debugMode = false;
const maxGroupLen = 100;

// create the connection to database
let connection;

async function initConnection() {
    connection = await mysql.createConnection({
        host: process.env.DBHOST,
        user: process.env.DBUSER,
        password: process.env.DBPASSWORD,
        database: process.env.DBNAME
    });
};

function dropConnection() {
    if (!connection) return;
    
    connection.end((err) => {
        if (err) console.log(err);
        connection = null;
    })
}

async function addProduct(product) {
    if (product.product_data) {
        product.product_data = JSON.stringify(product.product_data);
    }

    const keys = Object.keys(product);
    const values = Object.values(product);

    const query = `insert into product (${keys.join(', ')}) values(${values.map(() => '?').join(', ')})`;
    return runQuery(query, values);
};


async function addMultipleProducts(products) {
    const sortedProducts = products.map((n) => {
        if (n.product_data) {
            n.product_data = JSON.stringify(n.product_data)
        }

        return n;
    });

    let valuesArr = [];
    const keys = Object.keys(sortedProducts[0])

    products.forEach((n) => {
        const values = Object.values(n);
        valuesArr.push(values);
    });

    const query = `
        insert into product 
        (${keys.join(', ')})
        VALUES ?`

    return runQuery(query, [valuesArr]);
}

async function seperateAndAddMulitpleProducts(products) {
    await initConnection();

    const itemTotalLength = products.length;
    const itemGroups = Math.ceil(itemTotalLength / maxGroupLen);
    console.log('DB UPLOAD: -- item groups: ', itemGroups, ' | over ', itemTotalLength, ' products');

    for (var i = 0; i < itemGroups; i ++) {
        const startIndex = i * maxGroupLen;
        const group = products.slice(startIndex, startIndex + maxGroupLen);

        await addMultipleProducts(group);
        console.log('group added to database: ', startIndex, ' - ', startIndex + group.length + ' / ', itemTotalLength)
    }

    await dropConnection();
    return true;
}


// // simple query
// connection.query(
//   'SELECT * FROM `table` WHERE `name` = "Page" AND `age` > 45',
//   function(err, results, fields) {
//     console.log(results); // results contains rows returned by server
//     console.log(fields); // fields contains extra meta data about results, if available
//   }
// );
 
// // with placeholder
// connection.query(
//   'SELECT * FROM `table` WHERE `name` = ? AND `age` > ?',
//   ['Page', 45],
//   function(err, results) {
//     console.log(results);
//   }
// );



async function runQuery(query, placeholder) {
    // console.log(query, placeholder)
    return new Promise((resolve, reject) => {
        connection.query(query, placeholder, (err, results, fields) => {
            if (err) {
                reject(err);
            }

            resolve(results);
        });
    });
};


module.exports = {
    initConnection,
    runQuery,
    addProduct,
    addMultipleProducts,
    seperateAndAddMulitpleProducts,
    dropConnection
};