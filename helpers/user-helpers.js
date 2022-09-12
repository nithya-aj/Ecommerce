var db = require('../config/connection');
var collection = require('../config/collections');
var otp = require('../config/otp')
const client = require('twilio')(otp.accountSID, otp.authToken);
var bcrypt = require('bcrypt');
const { response } = require('../app');
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const { DeactivationsContext } = require('twilio/lib/rest/messaging/v1/deactivation');
const { resolve } = require('path');
let instance = new Razorpay({
    key_id: 'rzp_test_AyhfXZFR2tRSf5',
    key_secret: 'EzVaW3QLUIRjRr5NLbm0pC9N',
});

const paypal = require('paypal-rest-sdk');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AZgzl5x1SEBDbkz8E0wc9XhjDSFKnLLIoBsnZrrrKmrT0HujQIK3oTXS-35FuLj9u8uVZENq41mEf7cc',
    'client_secret': 'EFJyo3wpcYixg_5Eixc5A2ttofojvVfSmFP5qqTHu71xEZ_5gpyz0xov3_gxnOVc8TIZIm04uLurTMXD'
});



module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            // userData.password = await bcrypt.hash(userData.password, 10)
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
                client.verify.v2.services(otp.serviceID)
                    .verifications
                    .create({ to: '+91' + userData.phoneNumber, channel: 'sms' })
                    .then(verification => console.log(verification.status));
                console.log('no same email');
                console.log(otp.serviceID);
                resolve({ userData })
            }
        })
    },
    signupOtp: (userData, userDetails) => {
        return new Promise((resolve, reject) => {
            let response = {}
            client.verify.services(otp.serviceID)
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
            console.log(user, "-------------user in login-----------------------")
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    console.log(status, "---------------status in login-----------------")
                    if (status) {
                        if (user.userStatus) {
                            console.log('Login success');
                            response.user = user;
                            response.status = true;
                            resolve(response)
                        } else {
                            response.status = false
                            console.log('Login Failed becoz of user blocked');
                            response.err = "User is blocked"
                            resolve(response)
                        }
                    } else {
                        console.log('Login Failed cause of invalid email or password');
                        response.err = "Invalid email or password"
                        response.status = false
                        console.log(response);
                        resolve(response)
                    }
                })
            } else {
                console.log('Login Failed because of there is no user');
                response.err = "You do not have an account"
                response.status = false
                console.log(response);
                resolve(response)
            }
        })
    },

    getUsersData: () => {
        return new Promise(async (resolve, reject) => {
            let usersData = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(usersData)
        })
    },

    updateUser: (userId, userDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(userId) }, {
                    $set: {
                        firstName: userDetails.firstName,
                        lastName: userDetails.lastName,
                        phoneNumber: userDetails.phoneNumber,
                        email: userDetails.email,
                    }
                }).then((response) => {
                    resolve()
                })
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

    // ------------cart functions---------------

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
                        resolve({ status: true })
                    })
            }
        })
    },

    removeItem: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
        })
    },

    getTotalAmount: (userId) => {
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
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ["$quantity", "$product.price"] } }
                    }
                }
            ]).toArray()
            if (total[0]) {
                console.log('total[0].total');
                console.log(total[0].total);
                resolve(total[0].total);
            } else {
                console.log('totaltotal');
                resolve(0)
            }
        })
    },

    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total);
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    firstName: order.firstName,
                    lastName: order.lastName,
                    email: order.email,
                    phone: order.phone,
                    address: order.address,
                    landMark: order.landMark,
                    pinCode: order.pinCode
                },
                userId: objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: total,
                status: status,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                // db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve(orderObj._id)
            })
        })
    },

    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId);
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            console.log(cart);
            resolve(cart.products)
        })
    },

    clearCart: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) }).then((response) => {
                resolve()
            })
        })
    },

    // ---------------order functions----------------

    getUserOrders: (userId) => {
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ userId: objectId(userId) }).sort({ 'date': -1 }).toArray()
            console.log(orders);
            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
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
            console.log(orderItems);
            resolve(orderItems);
        })
    },
    generateRazorpay: (orderId, total) => {
        console.log(orderId, "-------------orderid");
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('-------------------------------------', order);
                    resolve(order)
                }
            });
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'EzVaW3QLUIRjRr5NLbm0pC9N')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }).then(() => {
                        resolve()
                    })
        })
    },
    generatePaypal: (orderId, total) => {
        return new Promise((resolve, reject) => {
            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/success",
                    "cancel_url": "http://localhost:3000/cancel"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "Red Sox Hat",
                            "sku": "001",
                            "price": total,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": total
                    },
                    "description": "Hat for the best team ever"
                }]
            };

            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    console.log(payment);
                    resolve(payment)
                }
            });
        })
    },

    applyCoupon: (data, userId) => {
        console.log(data);
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ couponName: data.couponName })
            let response = {}
            if (coupon) {
                console.log(coupon);
                let curentdate = new Date()
                let date = new Date(coupon.validTo)
                console.log(date);
                console.log(curentdate);
                if (curentdate <= date) {
                    if (coupon.user.includes(userId)) {
                        response.userErr = 'coupon code already used'
                        resolve(response)
                    } else {
                        db.get().collection(collection.COUPON_COLLECTION).updateOne({ couponName: data.couponName },
                            {
                                $push: { user: (userId) }
                            }).then(() => {
                                let discountPrice = data.total * coupon.discoundPrice / 100
                                let offerPrice = data.total - discountPrice
                                response.user = true
                                response.total = parseInt(offerPrice)
                                resolve(response)
                            })
                    }
                } else {
                    response.couponErr = 'coupon expired'
                    resolve(response)
                }
            } else {
                response.couponErr = 'invalid coupon'
                resolve(response)
            }
        })
    },

    changeStatus: (userId, orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId), userId: objectId(userId) }, {
                $set: {
                    status: 'placed'
                }
            }).then((data) => {
                console.log(data, "-------------data paypal--------------------");
                resolve()
            })
        })
    },

    cancelOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            console.log(orderId, "---------order id-----------");
            console.log(objectId(orderId));
            db.get().collection(collection.ORDER_COLLECTION).deleteOne({ _id: objectId(orderId) }).then((response) => {
                // console.log(response);
                resolve(response)
            })
        })
    },

    // --------------user profile functions ----------------------

    // editUserProfile: (userId, userDetails) => {
    //     return new Promise(async (resolve, reject) => {
    //         let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
    //         let userExit = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userDetails.email })
    //         let response = {}
    //         if (user.email == userDetails.email) {
    //             db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
    //                 $set: {
    //                     firstName: userDetails.firstName,
    //                     lastName: userDetails.lastName,
    //                     email: userDetails.email,
    //                     phoneNumber: userDetails.phoneNumber
    //                 }
    //             }).then((response) => {
    //                 resolve(response)
    //             })
    //         } else if (userExit) {
    //             response.err = true
    //             resolve(response)

    //         } else {
    //             db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
    //                 $set: {
    //                     firstName: userDetails.firstName,
    //                     lastName: userDetails.lastName,
    //                     email: userDetails.email,
    //                     phoneNumber: userDetails.phoneNumber
    //                 }
    //             }).then((response) => {
    //                 resolve(response)
    //             })
    //         }
    //     })
    // },
    // editUserProfile:(userId, userDetails)=>{
    //     return new Promise ((resolve, reject)=>{
    //         db.get().collection(collection.USER_COLLECTION)
    //         .updateOne({_id:objectId(userId)},{
    //             $set:{
    //                 firstName: userDetails.firstName,
    //                 lastName: userDetails.lastName,
    //                 email: userDetails.email,
    //                 phoneNumber: userDetails.phoneNumber
    //             }
    //         }).then((response)=>{
    //             resolve(response)
    //         })
    //     })
    // },
    editUserProfile: (userId, userDetails) => {

        return new Promise(async (resolve, reject) => {
            let response={}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            if (userDetails.email == user.email) {
                console.log("same Email");
                db.get().collection(collection.USER_COLLECTION).updateOne({  _id: objectId(userId) },
                    {
                        $set: {
                            firstName: userDetails.firstName,
                            lastName: userDetails.lastName,
                            email: userDetails.email,
                            phoneNumber: userDetails.phoneNumber
                        }

                    }).then((data) => {
                        resolve(data);
                    })
            } else {
                console.log("Not same Email");
                let response = {};
                let userDataEdit = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userDetails.email })
                if (userDataEdit) {
                    response.err = true
                    resolve(response)
                } else {
                    db.get().collection(collection.USER_COLLECTION).updateOne({  _id: objectId(userId) },
                        {
                            $set: {
                                firstName: userDetails.firstName,
                                lastName: userDetails.lastName,
                                email: userDetails.email,
                                phoneNumber: userDetails.phoneNumber
                            }
                        }
                    ).then((data) => {
                        resolve(data);
                    })
                }
            }
        })
    },

    changePassword: (userData, userId) => {
        return new Promise(async (resolve, reject) => {
            userData.newPassword = await bcrypt.hash(userData.newPassword, 10)
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {

                $set: {

                    password: userData.newPassword

                }
            }).then((data) => {
                console.log(userData);
                console.log("success");
                resolve(userData)
            })
        })
    }

}