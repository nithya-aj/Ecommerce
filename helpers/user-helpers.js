var db = require('../config/connection');
var collection = require('../config/collections');
const client = require('twilio')('ACf9af3508f42107fa635b3f9cd47d23ba', '0d68adc69582147eb735b26656a42bb8');
var bcrypt = require('bcrypt');
const { response } = require('../app');
var objectId = require('mongodb').ObjectId


module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            let userSignup = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            let response = {};
            if (userSignup) {
                response.err = 'Mail id is alredy used';
                resolve(response)
            } else if (userData.email == '' || userData.password == '' || userData.firstName == '' || userData.lastName == '') {
                response.err = 'Fill The Form';
                resolve(response)
            } else {
                // userData.userStatus = true;
                // db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                //     resolve(userData)
                // })
                userData.password = await bcrypt.hash(userData.password, 10)
                userData.userStatus = true;
                client.verify.v2.services(collection.serviceID)
                    .verifications
                    .create({ to: '+91' + userData.phoneNumber, channel: 'sms' })
                    .then(verification => console.log(verification.status));
                console.log('no same email');
                console.log(collection.serviceID);
                resolve({ userData })
            }
        })
    },
    signupOtp: (userData, userDetails) => {
        return new Promise((resolve, reject) => {
            let response = {}
            client.verify.services(collection.serviceID)
                .verificationChecks
                .create({
                    to: `+91${userDetails.phoneNumber}`,
                    code: userData.otp
                })
                .then((verification_check) => {
                    console.log(verification_check.status);
                    if (verification_check.status == 'approved') {
                        db.get().collection(collection.USER_COLLECTION).insertOne(userDetails).then((data) => {
                            resolve(userDetails)
                        })
                    } else {
                        response.err = 'otp is invalid';
                        console.log(response);
                        resolve(response)
                    }
                })
        })
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {};
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status && user.userStatus) {
                        console.log('Login success');
                        response.user = user;
                        response.status = true;
                        resolve(response)
                    } else {
                        console.log('Login Failed');
                        console.log(response);
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('Login Failed');
                resolve({ status: false })
            }
        })
    },

    getUsersData: () => {
        return new Promise(async (resolve, reject) => {
            let usersData = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(usersData)
        })
    },

    deleteUser: (userId) => {
        return new Promise((resolve, reject) => {
            console.log(userId);
            console.log(objectId(userId));
            db.get().collection(collection.USER_COLLECTION).deleteOne({ _id: objectId(userId) }).then((response) => {
                // console.log(response);
                resolve(response)
            })
        })
    },
    blockUser: (userId) => {
        return new Promise((resolve, reject) => {
            console.log(userId);
            console.log(objectId(userId));
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: { userStatus: false }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    unblockUser: (userId) => {
        return new Promise((resolve, reject) => {
            console.log(userId);
            console.log(objectId(userId));
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: { userStatus: true }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExit = userCart.products.findIndex(product => product.item == proId)
                console.log(proExit);
                if (proExit != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({
                        user: objectId(userId), 'products.item': objectId(proId)
                    },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: proObj }
                            }).then((response) => {
                                resolve()
                            })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            console.log(cartItems[0]?.products);
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve({status:true})
                    })
            }
        })
    },
    removeItem:(details)=>{
        return new Promise((resolve, reject)=>{
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:objectId(details.cart)},
            {
                $pull:{products:{item:objectId(details.product)}}
            }
            ).then((response)=>{
                resolve({removeProduct:true})
            })
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:["$quantity" ,"$product.price"]}}
                    }
                }
            ]).toArray()
            console.log(total[0].total);
            resolve(total[0].total);
        })
    },
    placeOrder:(order, products, total)=>{
        return new Promise((resolve, reject)=>{
            console.log(order, products, total);
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve, reject)=>{
            console.log(userId);
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            console.log(cart);
            resolve(cart.products)
        })
    }
}