

function addToCart(proId) {
    $.ajax({
      url: '/add-to-cart/' + proId,
      method: 'get',
      success: (response) => {
        if (response.status) {
          let count = $('#cart-count')
          count = parseInt(count) + 1
          $('#cart-count').html(count)
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
      success:(response)
    })
  })