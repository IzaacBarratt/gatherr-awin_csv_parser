const csv = require('csv-parser');
const fs = require('fs');

async function readAwinCSVFile(fileName) {
    let results = [];

    return new Promise((resolve, reject) => {
        try {
            fs.createReadStream(fileName)
            .pipe(csv())
            .on('data', data => results.push(data))
            .on('end', () => {
                resolve(results);
            });
        } catch (e) {
            reject(e);
        }
    })
}

function filterUniqueProducts(products) {
    // UNIQUENESS IS ONLY DEFINED BY NAME ATM
    // -- ALTHOUGH UPC IS PROBABLY A BETTER SHOUT


    let prodList = []; // Used to filter out names by storing
    let useProducts = [...products]; // Duplicate list so dont overwrite original - make functional
    const prodLen = products.length; // So dont have to keep calling func (some lists may be massive)

    for (var i = 0; i < prodLen; i ++) {
        const prod = products[i];
        const productName = prod.product_name;
        // Check if product list has that products exact name
        if (prodList.includes(productName)) {
            // If it does - set that product val to null - this gets filtered out at end
            useProducts[i] = null;
        } else {
            // If it's a unique name - add to product list
            prodList.push(productName);
        }
    }

    // Return non null results
    return useProducts.filter((n) => n !== null);
}

async function formatAwinCSVForDatabase(fileName) {
    const products = await readAwinCSVFile(fileName);

    console.log('-- reading file: ', fileName, ' | ', products.length, ' items -- ');
    const filteredProducts = filterUniqueProducts(products);
    console.log('--- filtered unique products (by name) | ', products.length - filteredProducts.length, ' products removed -- ');
    return filteredProducts;
}


module.exports = {
    readAwinCSVFile,
    formatAwinCSVForDatabase
}