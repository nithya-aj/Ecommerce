
function addToCart(proId) {

  $.ajax({
    url: '/add-to-cart/' + proId,
    method: 'get',
    success: (response) => {
      console.log("is cart working! Illalle...");
      console.log(response);
      if (response.status) {
        let count = $('#cart-count').html()
        count = parseInt(count) + 1
        $("#cart-count").html(count)
      }
    }
  })

}

$("#checkout-form").submit((e) => {
  e.preventDefault()
  $.ajax({
    url: '/place-order',
    method: 'post',
    data: $('#checkout-form').serialize(),
    success: (response)
  })
})

function changeQuantity(cartId, proId, userId, count) {
  console.log(cartId, proId, userId, count)
  let quantity = parseInt(document.getElementById(proId).innerHTML)
  count = parseInt(count)
  $.ajax({
    url: '/change-product-quantity',
    data: {
      cart: cartId,
      product: proId,
      user: userId,
      count: count,
      quantity: quantity
    },
    method: 'post',
    success: (response) => {
      if (response.removeProduct) {
        alert('Product removed from the cart')
        location.reload()
      } else {
        console.log(response)
        document.getElementById(proId).innerHTML = quantity + count
      }
    }
  })
}
function removeQuantity(cardId, proId, count) {
  let quantity = parseInt(document.getElementById(proId).innerHTML)
  count = parseInt(count)
  $.ajax({
    url: '/remove-product',
    data: {
      cart: cardId,
      product: proId,
      count: count,
      quantity: quantity
    },
    method: 'post',
    success: (response) => {
      if (response.removeProduct) {
        //swal({
        //  title: "Are you sure?",
        // text: "Once deleted, you will not be able to recover this imaginary file!",
        //    icon: "warning",
        //    buttons: true,
        //    dangerMode: true,
        //})
        //    .then((willDelete) => {
        //        if (willDelete) {
        //            swal("Poof! Your imaginary file has been deleted!", {
        //                icon: "success",
        //            });
        //        } else {
        //            swal("Your imaginary file is safe!");
        //        }
        //    }); 
        alert('Product removed from the cart')
        location.reload()
      } else {
        document.getElementById(proId).innerHTML = quantity + count
        document.getElementById('total').innerHTML = response.total
      }
    }
  })
}