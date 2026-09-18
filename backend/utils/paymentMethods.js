/**
 * Supported payment methods for this MVP (backend brief §24 Payment Approach:
 * "start with Cash on Delivery... Backend validates that the method is
 * supported"). Add a new value here (and only here) when a real gateway is
 * integrated — both the validator and the checkout service read this list.
 */
const SUPPORTED_PAYMENT_METHODS = ['cash_on_delivery'];

module.exports = { SUPPORTED_PAYMENT_METHODS };
