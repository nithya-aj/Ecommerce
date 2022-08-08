const { response } = require('express');
const e = require('express');
var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
const categoryHelpers = require('../helpers/category-helpers')
const verifyLogin = async (req, res, next) => {
  if (req.session.loggedIn) {
    {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
    }
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  console.log(user);
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let products = await productHelpers.getAllProducts()
  let category = await categoryHelpers.getAllCategory()
  res.render('index', { products, category, user_head: true, user, cartCount });
});

router.get('/product-details', (req, res) => {
  res.render('user/product-details', { user_head: true })
})

router.get('/view-products', verifyLogin, async function (req, res, next) {
  let user = req.session.user
  let products = await productHelpers.getAllProducts()
  let category = await categoryHelpers.getAllCategory()
  res.render('user/view-products', { products, category, user_head: true, user, cartCount });
})

router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.loginErr })
    req.session.loginErr = false
  }
})
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loginErr = true
      res.redirect('/login')
    }
  })
})

router.get('/signup', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/signup', {SignErr:req.session.signErr,otpErr: req.session.otpErr})
    req.session.otpErr= false
  }
})

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    if (response.err) {
      req.session.signErr = true
      res.redirect('/signup')
    } else {
      userDetais = response.userData
      res.render('user/verify-otp')
    }
  })
})

router.post('/verify-otp', (req, res) => {
  userHelpers.signupOtp(req.body, userDetais).then((response) => {
    if (response.err) {
      req.session.otpErr = response.err
      res.redirect('/signup')
    } else {
      req.session.loggedIn = true
      req.session.user = response
      res.redirect('/')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/user/wishlist', verifyLogin, (req, res) => {
  res.render('user/wishlist', { user_head: true })
})

router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let category = await categoryHelpers.getAllCategory()
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  console.log(products);
  res.render('user/cart', { products, category, user_head: true, user, cartCount, totalValue })
})

router.get('/add-to-cart/:id', (req, res) => {
  console.log("api call");
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  })
})

router.post('/change-product-quantity', (req, res, next) => {
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.post('/remove-product', (req, res) => {

  userHelpers.removeItem(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let category = await categoryHelpers.getAllCategory()
  res.render('user/place-order', { user_head: true, total, user: req.session.user, cartCount, category})
})

router.post('/place-order', async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice).then((response) => {
    res.json({status:true})
  })
  console.log(req.body);
})

router.get('/order-placed', async (req, res)=>{
  let category = await categoryHelpers.getAllCategory()
  res.render('user/order-placed',{user_head:true,user:req.session.user, category, cartCount})
})

router.get('/view-orders',verifyLogin, async(req, res)=>{
  let category = await categoryHelpers.getAllCategory()
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{user_head:true, user:req.session.user, category, cartCount, orders})  
})

router.get('/ordered-products/:id',async(req, res)=>{
  let products = await userHelpers.getOrderProducts(req.params.id)
  console.log(products);
  let category = await categoryHelpers.getAllCategory()
  res.render('user/ordered-products', {user_head:true, category, user:req.session.user, products, cartCount})
})

router.get('/product-details/:id', async(req, res)=>{
  console.log(req.params.id);
  let category = await categoryHelpers.getAllCategory()
  let product = await productHelpers.getProductDetails(req.params.id)
  userHelpers.addToCart.apply(req.params.id)
  console.log(product);
  res.render('user/product-details', {product , user:req.session.user._id, user_head:true, category, cartCount})
})

module.exports = router;
