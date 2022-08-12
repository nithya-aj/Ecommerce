var db = require('../config/connection')
var collection = require('../config/collections')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId

module.exports = {
    addProduct: (products, callback) => {
        products.price = parseInt(products.price)
        products.realPrice = parseInt(products.realPrice)
        db.get().collection('products').insertOne(products).then((data) => {
            callback(data.insertedId)
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            console.log(prodId);
            console.log(objectId(prodId));
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {
                // console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(proId) }, {
                    $set: {
                        badge: proDetails.badge,
                        category: proDetails.category,
                        name: proDetails.name,
                        description: proDetails.description,
                        price:parseInt( proDetails.price),
                        realPrice:parseInt(proDetails.realPrice),
                        brand: proDetails.brand,
                        collection: proDetails.collection,
                        function: proDetails.function,
                        movement: proDetails.movement,
                        warrenty: proDetails.warrenty,
                        waterResistance: proDetails.waterResistance,
                        dialColour: proDetails.dialColour,
                        dialShape: proDetails.dialShape,
                        caseMaterial: proDetails.caseMaterial,
                        caseThickness: proDetails.caseThickness,
                        strapColour: proDetails.strapColour,
                        strapMaterial: proDetails.strapMaterial,
                        glassMaterial: proDetails.glassMaterial,
                        lockMechanism: proDetails.lockMechanism,
                        images:proDetails.images
                    }
                }).then((response) => {
                    resolve()
                })
        })
    },
    addCategory: (category, callback) => {
        db.get().collection('category').insertOne(category).then((data) => {
            callback(data.insertedId)
        })
    },
    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },
    deleteCategory: (catId) => {
        return new Promise((resolve, reject) => {
            console.log(catId);
            console.log(objectId(catId));
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(catId) }).then((response) => {
                // console.log(response);
                resolve(response)
            })
        })
    },
    getCategoryDetails: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(catId) }).then((category) => {
                resolve(category)
            })
        })
    },
    updateCategory: (catId, catDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION)
                .updateOne({ _id: objectId(catId) }, {
                    $set: {
                        cat_name: catDetails.cat_name,
                        cat_desc: catDetails.cat_desc
                    }
                }).then((response) => {
                    resolve()
                })
        })
    }
}