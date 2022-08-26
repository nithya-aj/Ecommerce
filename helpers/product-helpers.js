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
    },
    getCod: () => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        paymentMethod: "COD",
                        status: "placed"
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            if (total[0]) {
                console.log(total[0].total);
                resolve(total[0].total)

            } else {
                resolve(0)
            }
        })
    },
    getRazorpay:()=>{
        return new Promise(async (resolve, reject)=>{
            let total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                        paymentMethod:"ONLINE",
                        status:"placed"
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            if(total[0]){
                resolve(total[0].total)
            }else{
                resolve(0)
            }
        })
    },
    getPaypal:()=>{
        return new Promise(async (resolve, reject)=>{
            let total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                        paymentMethod:"PAYPAL",
                        status:"placed"
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{
                            $sum:"$totalAmount"
                        }
                    }
                }
            ]).toArray()
            if(total[0]){
                resolve(total[0].total)
            }else{
                resolve(0)
            }
        })
    },
    getAllCoupons: () => {
        return new Promise(async (resolve, reject) => {
          let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
          resolve(coupons)
        })
    },
    addCoupon: (body) => {
        console.log(body,"---------------coupon----------------")
        body.user = []
        body.discoundPrice = parseInt(body.discoundPrice)
        return new Promise(async (resolve, reject) => {
          db.get().collection(collection.COUPON_COLLECTION).insertOne(body)
          resolve()
        })
    },
    deleteCoupon:(couponId)=>{
        return new Promise((resolve, reject)=>{
            console.log(couponId, "---------coupon id-----------");
            console.log(objectId(couponId));
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(couponId)}).then((response)=>{
                // console.log(response);
                resolve(response)
            })
        })
    },
    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
          let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
          resolve(orders)
        })
    },
    changeOrderStatus: (orderId, status) => {
        return new Promise((resolve, reject) => {
          db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
            $set: {
              status: status.status
            }
          }).then((response) => {
            resolve(response)
          })
        })
      },
}