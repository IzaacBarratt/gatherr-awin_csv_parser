const { formatAwinCSVForDatabase } = require('./awin');
const { seperateAndAddMulitpleProducts, dropConnection } = require('./database');
const { prepareAwinProductsForGatherrDatabase } = require('./format');

/*
async function uploadAwinCSV(fileName) {

    const products = await formatAwinCSVForDatabase(fileName);
    const formattedProducts = await prepareAwinProductsForGatherrDatabase(products);    

    await seperateAndAddMulitpleProducts(formattedProducts);
    await dropConnection(); // Just incase any connection is live and stops process
}
*/


const csv = require('csv-parser');
const fs = require('fs');
const { randomBytes } = require('crypto');

async function readCSVFile(fileName) {
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

async function convertCSVToJsonForProducts(fileName) {
    const results = await readCSVFile(fileName)
    //console.log(results)
    let idCounter = 1;

    const collections = {};

    for (var i = 0; i < results.length;  i ++) {
        const prod = results[i];
        idCounter += 1;

        const priceToUse = prod['Sale price'] || prod['Regular price'];

        const formattedProduct = {
            id: idCounter,
            brand: prod['Button text'].split('View on ')[1],
            type: 'affiliate',
            category: prod.Categories,
            upc: 23423423,
            name: prod.Name,
            price: {
                gbp: Math.round(parseFloat(priceToUse.replace('£', '')) * 100)
            },
            image: prod.Images,
            affiliate_link: prod['External URL']
        }
        //const collection = prod.Collections
        const collectionItems = prod.Tags.split(', ');
        console.log(collectionItems)
        for (let i = 0; i < collectionItems.length; i ++) {
            const collection = collectionItems[i];
            if (collections[collection]) {
                collections[collection].push(formattedProduct)
            } else {
                collections[collection] = [formattedProduct]
            }
        }       
    }


    await fs.writeFileSync('./files/formattedProducts.json', JSON.stringify(collections))
}
/*
{ Name: 'Le Creuset Classic Pepper Mill – Meringue',
    'Sale price': '£23.96',
    'Regular price': '£29.95',
    Categories: 'Home',
    Collections: 'Home Decor',
    Images:
     'https://annie.gatherr.co/wp-content/uploads/2020/09/44001217160000-scaled-1.jpg, https://annie.gatherr.co/wp-content/uploads/2020/09/ezgif-7-ecdf3dbe9e1b.png, https://annie.gatherr.co/wp-content/uploads/2020/09/ezgif-7-728fc3c9bc19.png',
    'External URL':
     'https://www.silvermushroom.com/product/le-creuset-classic-pepper-mill-meringue/',
    'Button text': 'Silver Mushroom',
    'Promo-code': '' },


"id": 2745,
"brand": "Nike",
"type": "affiliate",
"category": "T-Shirts",
"upc": "193655666407",
"name": "Nike Black Sportswear Heritage T-Shirt",
"product_comission": 0,
"gatherr_comission": 0,
"stickers": [
    "good value",
    "fairtrade"
],
"price": {
    "gbp": 2520,
    "eur": 2700,
    "usd": 3000
},
"image": "https://res.cloudinary.com/ssenseweb/image/upload/b_white%2Cc_lpad%2Cg_center%2Ch_960%2Cw_960/c_scale%2Ch_680/f_auto%2Cdpr_1.0/v572/202011M213017_1.jpg",
"affiliate_link": "http://click.linksynergy.com/link?id=BDVQG*ZKo4Q&offerid=818443.17522299936&type=15&murl=https%3A%2F%2Fwww.ssense.com%2Fen-us%2Fmen%2Fproduct%2Fnike%2Fblack-sportswear-heritage-t-shirt%2F5069981"
},

*/


convertCSVToJsonForProducts('./files/elliotdata.csv');


//uploadAwinCSV('files/datafeed_778451-lookfantastic.csv');