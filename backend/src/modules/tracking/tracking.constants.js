const ALLOWED_EVENTS = new Set([
  // A. Page Tracking
  'page_view', 'page_exit', 'page_duration', 'page_scroll', 'navigation', 'category_view',
  // B. Product Tracking
  'product_view', 'product_click', 'product_image_view', 'product_variant_select',
  'product_quantity_change', 'product_compare', 'product_share',
  // C. Search Tracking
  'search', 'search_result_click', 'search_no_result', 'search_filter', 'search_sort',
  // D. Shopping Cart Tracking
  'add_to_cart', 'remove_from_cart', 'update_cart_quantity', 'cart_view', 'cart_abandon',
  // E. Wishlist Tracking
  'wishlist_add', 'wishlist_remove', 'wishlist_view',
  // F. Checkout Tracking
  'checkout_start', 'checkout_information_submit', 'shipping_method_select',
  'payment_method_select', 'coupon_apply', 'coupon_remove', 'purchase', 'checkout_failed',
  // G. Customer Account Tracking
  'register', 'login', 'logout', 'profile_update',
  // H. Marketing Tracking
  'banner_view', 'banner_click', 'promotion_view', 'promotion_click', 'coupon_view'
]);

const SENSITIVE_KEYS = new Set([
  'password', 'passwordhash', 'token', 'jwt', 'accesstoken', 'refreshtoken',
  'cvv', 'cvc', 'cardnumber', 'card_number', 'expiry', 'pin', 'secret'
]);

const CONSENT_REQUIRED_EVENTS = new Set([
  'banner_view', 'banner_click', 'promotion_view', 'promotion_click'
]);

module.exports = {
  ALLOWED_EVENTS,
  SENSITIVE_KEYS,
  CONSENT_REQUIRED_EVENTS,
  MAX_BATCH_SIZE: 50
};

