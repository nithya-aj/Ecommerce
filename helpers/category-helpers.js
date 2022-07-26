var db = require('../config/connection')
var collection = require('../config/collections')
const { response } = require('../app')
var objectId=require('mongodb').ObjectId

module.exports = {
    addCategory: (category, callback) => {
        db.get().collection('category').insertOne(category).then((data) => {
            callback(data.insertedId)
        })
    },
    getAllCategory : () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },
    deleteCategory:(catId)=>{
        return new Promise((resolve, reject)=>{
            console.log(catId);
            console.log(objectId(catId));
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(catId)}).then((response)=>{
                // console.log(response);
                resolve(response)
            })
        })
    },
    getCategoryDetails:(catId)=>{
        return new Promise((resolve, reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(catId)}).then((category)=>{
                resolve(category)
            })
        })
    },
    updateCategory:(catId, catDetails)=>{
        return new Promise((resolve, reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION)
            .updateOne({_id:objectId(catId)},{
                $set:{
                    cat_name:catDetails.cat_name,
                    cat_desc:catDetails.cat_desc
                }
            }).then((response)=>{
                resolve()
            })
        })
    }
}