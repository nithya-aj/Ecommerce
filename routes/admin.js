const { response } = require('express');
var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')
var categoryHelpers = require('../helpers/category-helpers')

/* GET users listing. */
router.get('/', function (req, res) {
  res.render('admin/homepage', { admin: true })
})

router.get('/view-products',async function (req, res, next) {
  let products = await productHelpers.getAllProducts()
  let category = await categoryHelpers.getAllCategory()
    res.render('admin/view-products', { products,category, admin: true });
});

router.get('/add-product',async function (req, res) {
  let category = await categoryHelpers.getAllCategory()
  res.render('admin/add-product', { admin: true, category })
})

router.post('/add-product', (req, res) => {
  productHelpers.addProduct(req.body, (insertedId) => {
    let image = req.files.image
    console.log(image);
    image.mv('./public/assets/images/products/' + insertedId + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-product', { admin: true})
      } else {
        console.log(err);
      }
    })
  })
});
router.get('/delete-product/:id', (req, res) => {
  let prodId = req.params.id
  console.log(prodId)
  productHelpers.deleteProduct(prodId).then((response) => {
    res.redirect('/admin/view-products')
  })
})

router.get('/edit-product/:id', async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  let category = await categoryHelpers.getAllCategory(req.params.id)
  console.log(product);
  res.render('admin/edit-product', { admin: true, product,category })
})

router.post('/edit-product/:id', (req, res) => {
  let id = req.params.id
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    if (req.files.image) {
      let image = req.files.image
      console.log(image);
      image.mv('./public/assets/images/products/' + id + '.jpg')
      res.redirect('/admin/view-products')
    }
  })
})

//--- category --- 
router.get('/view-category', function (req, res, next) {
  categoryHelpers.getAllCategory().then((category) => {
    res.render('admin/view-category', { category, admin: true });
  })
});

router.get('/add-category', function (req, res) {
  res.render('admin/add-category', { admin: true })
})

router.post('/add-category', (req, res) => {
  categoryHelpers.addCategory(req.body, (insertedId) => {
    let image = req.files.cat_image
    console.log(image);
    image.mv('./public/assets/images/products/' + insertedId + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-category', { admin: true })
      } else {
        console.log(err);
      }
    })
  })
});
router.get('/delete-category/:id', (req, res) => {
  let catId = req.params.id
  console.log(catId)
  categoryHelpers.deleteCategory(catId).then((response) => {
    res.redirect('/admin/view-category')
  })
})

router.get('/edit-category/:id', async (req, res) => {
  let category = await categoryHelpers.getCategoryDetails(req.params.id)
  console.log(category);
  res.render('admin/edit-category', { admin: true, category })
})

router.post('/edit-category/:id', (req, res) => {
  let id = req.params.id
  categoryHelpers.updateCategory(req.params.id, req.body).then(() => {
    if (req.files.cat_image) {
      let image = req.files.cat_image
      console.log(image);
      image.mv('./public/assets/images/products/' + id + '.jpg')
      res.redirect('/admin/view-category')
    }
  })
})


// --- user ---
router.get('/view-users', function (req, res, next) {
  userHelpers.getUsersData().then((usersData) => {
    console.log(usersData);
    res.render('admin/view-users', { usersData, admin: true })
  })
});
router.get('/delete-user/:id', (req, res) => {
  let userId = req.params.id
  console.log(userId)
  userHelpers.deleteUser(userId).then((response) => {
    res.redirect('/admin/view-users')
  })
})
router.get('/edit-user/:id', async (req, res) => {
  let userInfo = await userHelpers.getUsersData(req.params.id)
  console.log(userInfo);
  res.render('admin/edit-user', { admin: true, userInfo })
})
router.post('/edit-user/:id', (req, res) => {
  let id = req.params.id
  userHelpers.updateUser(req.params.id, req.body).then(() => {
    res.redirect('/admin/view-users')
  })
})
router.get('/block-user/:id', (req, res) => {
  let userId = req.params.id
  userHelpers.blockUser(userId).then((response) => {
    res.redirect('/admin/view-users')
  })
})
router.get('/unblock-user/:id', (req, res) => {
  let userId = req.params.id
  userHelpers.unblockUser(userId).then((response) => {
    res.redirect('/admin/view-users')
  })
})

module.exports = router;
