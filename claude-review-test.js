// Temporary file to smoke-test the automated Claude PR reviewer. Safe to delete.
function createOrder(razorpay, options) {
  // Missing `await`: `order` is a pending Promise, so `order.id` is undefined.
  const order = razorpay.orders.create(options);
  return order.id;
}

module.exports = { createOrder };
