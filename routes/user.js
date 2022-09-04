const { response } = require("express");
const e = require("express");
var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const paypal = require("paypal-rest-sdk");
const verifyLogin = async (req, res, next) => {
  if (req.session.userLoggedIn) {
    {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
    }
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  try{
    let user = req.session.user;
    console.log(user);
    let cartCount = null;
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
    }
    let products = await productHelpers.getAllProducts();
    let category = await categoryHelpers.getAllCategory();
    res.render("index", { products, category, user_head: true, user, cartCount });
  }catch (error) {
    console.log(error);
  }
});

router.get("/login", (req, res) => {
  try{
    if (req.session.user) {
      res.redirect("/");
    } else {
      res.render("user/login", { loginErr: req.session.loginErr });
      req.session.loginErr = false;
    }
  }catch (error) {
    console.log(error);
  }
});
router.post("/login", (req, res) => {
  try{
    userHelpers.doLogin(req.body).then((response) => {
      // if (response.err) {
      //   req.session.loginErr = response.err;
      //   res.redirect("/login");
      // } else {
      if (response.status) {
        req.session.userLoggedIn = true;
        req.session.user = response.user;
        console.log(response.status);
        res.redirect("/");
      } else {
        req.session.loginErr = response.err;
        res.redirect("/login");
      }
      // }
    });
  }catch (error) {
    console.log(error);
  }
});

router.get("/signup", (req, res) => {
  try{
    if (req.session.userLoggedIn) {
      res.redirect("/");
    } else {
      res.render("user/signup", {
        SignErr: req.session.signErr,
        otpErr: req.session.otpErr,
      });
      req.session.otpErr = false;
    }
  }catch (error) {
    console.log(error);
  }
});

router.post("/signup", (req, res) => {
  try{
    userHelpers.doSignup(req.body).then((response) => {
      if (response.err) {
        req.session.signErr = true;
        res.redirect("/signup");
      } else {
        userDetails = response.userData;
        res.render("user/verify-otp");
      }
    });
  }catch (error) {
    console.log(error);
  }
});

router.post("/verify-otp", (req, res) => {
  try{
    userHelpers.signupOtp(req.body, userDetails).then((response) => {
      if (response.err) {
        req.session.user.otpErr = response.err;
        res.redirect("/signup");
      } else {
        req.session.user = response;
        req.session.userLoggedIn = true;
        res.redirect("/");
      }
    });
  }catch (error) {
    console.log(error);
  }
});

router.get("/logout", (req, res) => {
  try{
    req.session.user = null;
    req.session.userLoggedIn = false;
    res.redirect("/");
  }catch (error) {
    console.log(error);
  }
});

router.get("/product-details", async(req, res) => {
  try{
    let user = req.session.user;
    let products = await userHelpers.getCartProducts(req.session.user._id);
    res.render("user/product-details", { user_head: true, user, products});
  }catch (error) {
    console.log(error);
  }
});

router.get("/view-products", verifyLogin, async function (req, res, next) {
  try{
    let user = req.session.user;
    let products = await productHelpers.getAllProducts();
    let category = await categoryHelpers.getAllCategory();
    res.render("user/view-products", {
      products,
      category,
      user_head: true,
      user,
      cartCount,
    });
  }catch (error) {
    console.log(error);
  }
});

router.get("/user/wishlist", verifyLogin, (req, res) => {
  res.render("user/wishlist", { user_head: true });
});

// ----------------cart----------------------

router.get("/cart", verifyLogin, async (req, res) => {
  try{
    let user = req.session.user;
    let products = await userHelpers.getCartProducts(req.session.user._id);
    let category = await categoryHelpers.getAllCategory();
    let totalValue = await userHelpers.getTotalAmount(req.session.user._id);
    console.log(products);
    res.render("user/cart", {
      products,
      category,
      user_head: true,
      user,
      cartCount,
      totalValue,
    });
  }catch (error) {
    console.log(error);
  }
});

router.get("/add-to-cart/:id", (req, res) => {
  try{
    console.log("api call");
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
      res.json({ status: true });
    });
  }catch (error) {
    console.log(error);
  }
});

router.post("/change-product-quantity", (req, res, next) => {
  try{
    console.log(req.body);
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = await userHelpers.getTotalAmount(req.body.user);
      res.json(response);
    });
  }catch (error) {
    console.log(error);
  }
});

router.post("/remove-product", (req, res) => {
  try{
    userHelpers.removeItem(req.body).then((response) => {
      res.json(response);
    });
  }catch (error) {
    console.log(error);
  }
});

// -----------------coupon and checkout-----------------------

router.post('/apply-coupon', verifyLogin, async (req, res) => {
  try {
    userHelpers.applyCoupon(req.body, req.session.user._id).then((response) => {
      console.log(response);
      if (response.total) {
        req.session.total = parseInt(response.total)
      }
      res.json(response)
    })
  } catch (error) {
    console.log(error);
  }

})

router.get("/place-order", verifyLogin, async (req, res) => {
  try{
    let total = await userHelpers.getTotalAmount(req.session.user._id);
    let category = await categoryHelpers.getAllCategory();
    res.render("user/place-order", {
      user_head: true,
      total,
      user: req.session.user,
      cartCount,
      category
    });
  }catch (error) {
    console.log(error);
  }
});

router.post("/place-order", async (req, res) => {
  try{
    let products = await userHelpers.getCartProductList(req.body.userId);
    let totalPrice = await userHelpers.getTotalAmount(req.body.userId);
    userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
      if (req.body["payment-method"] === "COD") {
        res.json({ codSuccess: true });
      } else if (req.body["payment-method"] === "PAYPAL") {
        console.log("****************");
        userHelpers.generatePaypal(orderId, totalPrice).then((response) => {
          req.session.orderId = orderId
          console.log('response');
          console.log(response);
          response.paypalSuccess = true;
          res.json(response);
        });
      } else {
        userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
          res.json(response);
        });
      }
    });
    console.log(req.body);
  }catch (error) {
    console.log(error);
  }
});

router.get("/success", async (req, res) => {
  try{

    let totalPrice = await userHelpers.getTotalAmount(req.session.user._id);
    await userHelpers.clearCart(req.session.user._id)
  
    console.log('totalPrice');
    console.log(totalPrice);
    userHelpers.changeStatus(req.session.user._id, req.session.orderId)
  
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
  
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [
        {
          "amount": {
            "currency": "USD",
            "total": totalPrice,
          },
        },
      ],
    };
  
    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      function (error, payment) {
        console.log(payment);
        if (error) {
          console.log(error.response);
          throw error;
        } else {
          console.log(JSON.stringify(payment));
          res.redirect("/order-placed");
        }
      }
    );
  }catch (error) {
    console.log(error);
  }
});

router.get("/order-placed", async (req, res) => {
  try{
    let category = await categoryHelpers.getAllCategory();
    await userHelpers.clearCart(req.session.user._id)
    res.render("user/order-placed", {
      user_head: true,
      user: req.session.user,
      category,
      cartCount,
    });
  }catch (error) {
    console.log(error);
  }
});

// ------------orders-----------------

router.get("/view-orders", verifyLogin, async (req, res) => {
  try{
    let category = await categoryHelpers.getAllCategory();
    let orders = await userHelpers.getUserOrders(req.session.user._id);
    res.render("user/orders", {
      user_head: true, user: req.session.user, category, cartCount, orders
    });
  }catch (error) {
    console.log(error);
  }
});

router.get('/cancel-order/:id', (req, res) => {
  try{
    let orderId = req.params.id
    console.log(orderId)
    userHelpers.cancelOrder(orderId).then((response) => {
      res.redirect('/view-orders')
    })
  }catch (error) {
    console.log(error);
  }
}),

  router.get("/ordered-products/:id", async (req, res) => {
    try{
      let products = await userHelpers.getOrderProducts(req.params.id);
      console.log(products);
      let category = await categoryHelpers.getAllCategory();
      res.render("user/ordered-products", {
        user_head: true, category, user: req.session.user, products, cartCount
      });
    }catch (error) {
      console.log(error);
    }
  });

router.get("/product-details/:id", verifyLogin, async (req, res) => {
  try{
    console.log(req.params.id);
    let category = await categoryHelpers.getAllCategory();
    let product = await productHelpers.getProductDetails(req.params.id);
    userHelpers.addToCart.apply(req.params.id);
    console.log(product);
    res.render("user/product-details", {
      product,
      user: req.session.user._id,
      user_head: true,
      category,
      cartCount,
    });
  }catch (error) {
    console.log(error);
  }
});

router.post("/verify-payment", (req, res) => {
  try{
    console.log(req.body);
    userHelpers
      .verifyPayment(req.body)
      .then(() => {
        userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
          console.log("Payment Successful");
          res.json({ status: true });
        });
      })
      .catch((err) => {
        console.log("error--------" + err);
        res.json({ status: false, errMsg: "" });
      });
  }catch (error) {
    console.log(error);
  }
});

// ------------------user profile-------------------------

router.get("/my-profile", verifyLogin, async (req, res) => {
  try{
    let category = await categoryHelpers.getAllCategory();
    res.render("user/user-profile", {
      user: req.session.user, category, cartCount, user_head: true
    });
  }catch (error) {
    console.log(error);
  }
});

router.get('/edit-profile', async (req, res) => {
  try{
    let category = await categoryHelpers.getAllCategory();
    res.render('user/edit-profile', {
      user: req.session.user, category, user_head: true, cartCount
    });
  }catch (error) {
    console.log(error);
  }
})

router.post("/edit-profile/:id", (req, res) => {
  try{
    userHelpers.editUserProfile(req.params.id, req.body).then(() => {
      res.redirect("/my-profile");
    })
  }catch (error) {
    console.log(error);
  }
});

router.get('/change-password', verifyLogin, async (req, res) => {
  try{
    let category = await categoryHelpers.getAllCategory();
    res.render('user/change-password', {
      user: req.session.user, category, user_head: true, cartCount
    })
  }catch (error) {
    console.log(error);
  }
})

router.post('/change-password', verifyLogin, async (req, res) =>{
  try{
    userHelpers.changePassword(req.body, req.session.user._id).then((response) => {
      res.redirect('/my-profile')
    })
  }catch(error){
    console.log(error);
  }
})

// invoice 

router.get('/view-invoice/:id', async(req, res)=>{
  try{
    let orderId = req.params.id
    let category = await categoryHelpers.getAllCategory();
    let orders = await userHelpers.getUserOrders(req.session.user._id);
    let products = await userHelpers.getOrderProducts(req.params.id);
    res.render('user/view-invoice', {user: req.session.user, orderId, orders, products, category, user_head:true})
  }catch (error) {
    console.log(error);
  }
})

module.exports = router;
