const { response } = require('express');
var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')
var categoryHelpers = require('../helpers/category-helpers')
var adminHelpers = require('../helpers/admin-helpers')
var multer = require('multer')

var storageds = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, './public/assets/images/products')
  },
  filename: function(req, file, cb){
    cb(null, Date.now() + file.originalname)
  }
})
const verifyLogin = (req, res, next) => {
  if (req.session.adminLogin) {
    next();
  } else {
    res.render('admin/login', { adminErr: req.session.adminLoginErr})
    req.session.adminLoginErr = false;
  }
}

var upload = multer({storage: storageds})
// admin login

router.post('/admin-login', (req, res) => {
  adminHelpers.doAdminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminLogin = true;
      req.session.admin = response.admin;
      res.redirect('/admin')
    } else {
      req.session.adminLoginErr = "Incorrect username or password ";
      res.redirect('/admin')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.admin = null;
  req.session.adminLogin = null;
  res.redirect('/admin')
})

/* GET users listing. */
router.get('/',verifyLogin, async(req, res) =>{
  let cod= await productHelpers.getCod()
  let razorpay = await productHelpers.getRazorpay()
  let paypal = await productHelpers.getPaypal()
  res.render('admin/homepage', { admin: true , cod, razorpay, paypal})
})

router.get('/view-products', verifyLogin,async function (req, res, next) {
  let products = await productHelpers.getAllProducts()
  let category = await categoryHelpers.getAllCategory()
    res.render('admin/view-products', { products,category, admin: true });
});

router.get('/add-product', verifyLogin,async function (req, res) {
  let category = await categoryHelpers.getAllCategory()
  res.render('admin/add-product', { admin: true, category })
})

router.post('/add-product', upload.array('images', 4), (req, res) => {
  var filenames = req.files.map(function(file){
    return file.filename;
  })
  req.body.images = filenames;
  productHelpers.addProduct(req.body, (insertedId) => {
    res.redirect('/admin/add-product')
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

router.post('/edit-product/:id', upload.array('images', 4), (req, res) => {
  var filenames = req.files.map(function(file){
    return file.filename;
  })
  req.body.images = filenames;
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/view-products')
  }) 
});

//--- category --- 
router.get('/view-category', verifyLogin, function (req, res, next) {
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

router.get('/view-users', verifyLogin, function (req, res, next) {
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

// coupons
router.get('/view-coupons', verifyLogin, function (req, res, next) {
  productHelpers.getAllCoupons().then((coupons) => {
    res.render('admin/view-coupons', { coupons, admin: true });
  })
});

router.get('/add-coupon', verifyLogin, function (req, res) {
  res.render('admin/add-coupon', { admin: true })
})

router.post('/add-coupon', (req, res) => {
  productHelpers.addCoupon(req.body).then((response) => {
    res.redirect('/admin/add-coupon')
  })
});

router.get('/delete-coupon/:id', (req, res) => {
  let couponId = req.params.id
  console.log(couponId)
  productHelpers.deleteCoupon(couponId).then((response) => {
    res.redirect('/admin/view-coupons')
  })
})

router.get("/view-orders", verifyLogin, async (req, res) => {
  productHelpers.getAllOrders().then((orders)=>{
    console.log(orders,"------------orders in admin side----------------");
    res.render('admin/view-orders', { admin: true, orders})
  })
});

router.get("/ordered-products/:id", async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id);
  console.log(products);
  let category = await categoryHelpers.getAllCategory();
  res.render("user/ordered-products", {
    user_head: true,
    category,
    user: req.session.user,
    products,
    cartCount,
  });
});

router.post('/change-order-status/:id', (req, res) => {
  console.log(req.params);
  console.log(req.body);
  productHelpers.changeOrderStatus(req.params.id, req.body).then((response) => {
    res.json({ status: true })
  })
})

module.exports = router;
