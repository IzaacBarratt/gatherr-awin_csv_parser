const axios = require('axios');
let currencyRates;
let brandList = [];


async function getConversionRatesFromUSD() {
    if (currencyRates) return currencyRates;
    // Currencies to get results for - this will dictate what shows up in final product
    const currencies = [
        'USD',
        'GBP',
        'EUR'
    ].join(',')

    // This API defaults to USD
    try {
        const currencyFreaksAPIKey = '09c021d6a0f34cc19c2f43df8750da6d';
        const currencyFreaksUrl = `https://api.currencyfreaks.com/latest?apikey=${currencyFreaksAPIKey}&symbols=${currencies}`;
        const result = await axios.get(currencyFreaksUrl);

        if (!result.data || !result.data.rates) {
            throw new Error('No rates data for currency conversion')
        }

        const rates = result.data.rates;

        currencyRates = rates;
        return rates;
    } catch (e) {
        console.log('Get currency off USD failed ')
        throw e;
    }
}


function formatCurrencyNumber(number /*float*/) {
    return Math.round(number * 100).toString() // get minimal pence amount
}


async function formatProductPrice(value, currency) {
    const rates = await getConversionRatesFromUSD();

    let currencies = {};

    // Gets value of product in USD, means all currency conversions can be blankeeted to that
    let baseUsdVal = (currency === 'usd' || currency === 'USD') ? value : null;
    if (!baseUsdVal) {
        const baseConvRateFromUsd = rates[currency.toUpperCase()]
        const baseConvRateFloat = parseFloat(baseConvRateFromUsd);
        const usdConvRate = 1 / baseConvRateFloat;
        baseUsdVal = value * usdConvRate;
    }

    const currencyKeys = Object.keys(rates);
    for (var i = 0; i < currencyKeys.length; i ++) {
        const rateCurrency = currencyKeys[i];
        const convRate = rates[rateCurrency];
        const currencyVal = baseUsdVal * convRate;
        currencies[rateCurrency.toLowerCase()] = formatCurrencyNumber(currencyVal);
    }

    return currencies;
}


async function createIfBrandExistsAddIfDoesnt(brand_name, brand_image) {
    return {
        brand_name: '',
        brand_id: 0,
        brand_image: 'https://asdfj.com'
    }

    // Check if brand list has brand by this name
    let brandData = brandList.filter((n) => n.brand_name === brand_name);
    if (!brandData) {
        // If it doesn't - add to brand list (must update db)

        brandList.push({
            brand_name,
            brand_image,

        })
    }

    return brandData
}


async function formatAwinProductForGatherr(product, retailerData) {
    const {
        retailer_id,
        retailer_name,
        retailer_image
    } = retailerData;

    const {
        data_feed_id,
        merchant_id,

        upc,
        ean,
        mpn,
        isbn,
        category_name,
        aw_deep_link,
        aw_image_url,
        product_name,
        description,
        specifications,
        product_short_description,

        aw_product_id,
        //data_feed_id,

        currency,
        rrp_price,
        search_price,
        in_stock,
        base_price,
        base_price_amount,
        base_price_text,

        brand_id: product_brand_id,
        brand_name: product_brand_name,

        custom_1,
        custom_2,

        merchant_product_id,
        merchant_category,
        merchant_deep_link,
        merchant_image_url,

        basket_link,
        delivery_time,
    } = product;

    // convert currency to usd
    const productPrice = await formatProductPrice(base_price, currency);
    const usdPrice = productPrice.usd;

    // get brand ID on brand name
    const brandData = await createIfBrandExistsAddIfDoesnt(product_brand_name);
    const {
        brand_name,
        brand_image,
        brand_id
    } = brandData;

    const gatherrProduct = {
        product_name,
        product_upc: upc,
        brand_id,
        retailer_id,
        primary_category: merchant_category,
        secondary_category: '',
        product_type: 'affiliate',

        usd_price: usdPrice,
        created_on: new Date(),

        product_data: {
            product_keywords: [],
            product_sku: mpn,
            product_description: description,
            product_image: aw_image_url,
            affiliate_link: aw_deep_link,

            // eg AWIN, Rakuten, Datafiniti (where we're getting the data from)
            provider_created_on: custom_2,
            product_pricing: productPrice,

            // eg Hugo Boss, Fendi (creator of product)
            brand_name,///: brandData.name,
            brand_provider_id: aw_product_id,
            brand_image,//: brandData.image,

            // eg Look Fantastic, SSENSE (retailer synonymous with merchant, it's where it's being sold)
            retailer_name,
            retailer_image,
            retailer_link_id: merchant_product_id,
        }
    }

    return gatherrProduct;
}


async function prepareAwinProductsForGatherrDatabase(products) {
    const retailerData = {
        retailer_id: 10,
        retailer_image: '',
        retailer_name: 'Look Fantastic'
    }
    
    let formattedProducts = [];

    for (var i = 0; i < products.length; i ++) {
        const product = products[i];
        console.log(' --- product parse: ', i, ' / ', products.length, ' --- ')
        const formattedProduct = await formatAwinProductForGatherr(product, retailerData);
        formattedProducts.push(formattedProduct);
        console.log(' ---- product ', i, ' added ---')
    }

    return formattedProducts;
}

module.exports = {
    prepareAwinProductsForGatherrDatabase
}