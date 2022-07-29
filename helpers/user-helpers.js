var db = require('../config/connection');
var collection = require('../config/collections');
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
                userData.userStatus = true;
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    resolve(userData)
                })
            }
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
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ user: objectId(userId) },
                        {
                            $push: { products: objectId(proId) }
                        }).then((response) => {
                            resolve()
                        })
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [objectId(proId)]
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
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        let: { prodList: '$products' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ['$_id', '$$prodList']
                                    }
                                }
                            }
                        ],
                        as: 'cartItems'
                    }
                }
            ]).toArray()
            resolve(cartItems[0].cartItems)
        })
    }
}