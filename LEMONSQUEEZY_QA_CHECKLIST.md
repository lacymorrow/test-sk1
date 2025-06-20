# LemonSqueezy Integration QA Checklist

## 🧪 Comprehensive Testing Guide

This checklist will help you verify that all LemonSqueezy integration fixes are working correctly. Test each section thoroughly and mark items as ✅ when verified.

---

## 📋 Pre-Testing Setup

### Environment Configuration

- [ ] ✅ `LEMONSQUEEZY_API_KEY` is set in your environment
- [ ] ✅ `NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED=true` is set
- [ ] ✅ Application starts without errors
- [ ] ✅ No TypeScript compilation errors

### Database Setup

- [ ] Database is running and accessible
- [ ] Payment tables exist and are properly migrated

---

## 🏪 Product Configuration Tests

### Site Configuration

- [ ] **Test 1: Verify site config products**
  - Check that `src/config/site-config.ts` contains valid variant IDs (UUIDs)
  - All 4 products configured: `bones`, `muscles`, `brains`, `shipkit`
  - Expected format: `eb159dba-96a3-40f2-a97b-7b9117e635a1`

### Buy URL Generation

- [ ] **Test 2: Manual URL testing**
  - Generate buy URLs for each product using site config
  - Example: `https://shipkit.lemonsqueezy.com/checkout/buy/eb159dba-96a3-40f2-a97b-7b9117e635a1`
  - Test in browser - should reach LemonSqueezy checkout (no 404)

---

## 🔌 API Integration Tests

### Core API Functions

- [ ] **Test 3: `fetchLemonSqueezyProducts()`**
  - Should return all products from your store
  - Check response contains `id`, `attributes.name`, etc.

- [ ] **Test 4: `fetchLemonSqueezyVariants()`** ⭐ **NEW**
  - Should return all variants from your store
  - Check response contains `id`, `attributes.name`, `attributes.price`, etc.

- [ ] **Test 5: `fetchConfiguredLemonSqueezyProducts()`** ⭐ **NEW**
  - Should return only configured variants from site config
  - Each item should have `productKey` field
  - Buy URLs should be correct and point to variant checkouts

### Utility Functions

- [ ] **Test 6: `getConfiguredVariantIds()`** ⭐ **NEW**
  - Should return array of variant IDs from site config
  - Should match the UUIDs in `site-config.ts`

- [ ] **Test 7: `getVariantIdForProduct(productKey)`** ⭐ **NEW**
  - Test with "bones" → should return "eb159dba-96a3-40f2-a97b-7b9117e635a1"
  - Test with "shipkit" → should return "20b5b59e-b4c4-43b0-9979-545f90c76f28"

- [ ] **Test 8: `getProductKeyForVariant(variantId)`** ⭐ **NEW**
  - Test with "eb159dba-96a3-40f2-a97b-7b9117e635a1" → should return "bones"
  - Test with "20b5b59e-b4c4-43b0-9979-545f90c76f28" → should return "shipkit"

---

## 🛒 Checkout & Payment Flow Tests

### Pricing Components

- [ ] **Test 9: LemonSqueezy Pricing Page**
  - Visit `/lemonsqueezy` or wherever the pricing component is displayed
  - Should show only configured products (not all store products)
  - Each product card should have correct price and buy URL
  - Buy buttons should include `data-variant-id` and `data-product-key` attributes

### Buy Button Integration

- [ ] **Test 10: Buy Button Click**
  - Click buy button on any pricing component
  - Should open LemonSqueezy checkout overlay (not redirect to separate page)
  - Checkout should show correct product/variant
  - Dark theme should be applied (`dark=1` in URL)

### Checkout Process

- [ ] **Test 11: Complete Test Purchase** 🔥 **CRITICAL**
  - Use LemonSqueezy test mode or create actual purchase
  - Complete checkout with valid payment info
  - Should redirect to dashboard after success
  - Check webhook is received and processed correctly

### Webhook Handling

- [ ] **Test 12: Webhook Processing** 🔥 **CRITICAL**
  - Webhook should create payment record in database
  - Should include variant_id in metadata (not just product_id)
  - Should link payment to correct user account
  - Check webhook logs for any errors

---

## 👥 Admin Panel Tests

### Payment Management

- [ ] **Test 13: Admin Payments Page**
  - Visit `/admin/payments`
  - Should display all payments with correct metadata
  - Variant information should be visible and accurate
  - Import payments function should work without errors

### User Management

- [ ] **Test 14: Admin Users Page**
  - Visit `/admin/users`
  - Should show payment status correctly for users with LemonSqueezy purchases
  - User drawer should display purchase history with correct product names

### Payment Import

- [ ] **Test 15: Payment Import Function**
  - Use "Import Users & Payments" → "Lemon Squeezy"
  - Should import existing payments from LemonSqueezy
  - Should correctly map products to variants
  - Should create user accounts for customers not yet in database

---

## 🔐 User Payment Verification Tests

### Payment Status Checks

- [ ] **Test 16: `getUserPaymentStatus(userId)`**
  - Should return `true` for users who have made purchases
  - Should work with both email matching and user ID in custom_data
  - Should return `false` for users without purchases

### Product-Specific Verification

- [ ] **Test 17: `hasUserPurchasedAnyConfiguredProduct(userId)`** ⭐ **NEW**
  - Should return `true` only for configured products (not all store products)
  - Should work correctly with variant IDs

### LemonSqueezy Provider Integration

- [ ] **Test 18: PaymentService integration**
  - `PaymentService.getUserPaymentStatus(userId)` should work
  - Should include LemonSqueezy in payment status checks
  - Should work seamlessly with other payment providers (if any)

---

## 📱 UI/UX Integration Tests

### Pricing Display

- [ ] **Test 19: Multiple Pricing Components**
  - Check pricing sections throughout the app
  - All should use correct variant-based URLs
  - No broken or 404 checkout links

### Product Links

- [ ] **Test 20: Navigation & CTAs**
  - Primary CTA buttons should work
  - Footer links should work
  - All "Get Started" / "Buy Now" buttons should use correct URLs

---

## 🔍 Error Handling & Edge Cases

### Configuration Errors

- [ ] **Test 21: Invalid Configuration**
  - Test with feature flag disabled
  - Test with missing API key
  - Should fail gracefully without breaking the app

### API Failures

- [ ] **Test 22: Network Issues**
  - Test with invalid API key
  - Should handle API errors gracefully
  - Should not crash the application

### Webhook Edge Cases

- [ ] **Test 23: Webhook Error Handling**
  - Test duplicate webhook delivery
  - Test malformed webhook data
  - Should handle errors and log appropriately

---

## 📊 Data Consistency Tests

### Database Integrity

- [ ] **Test 24: Payment Records**
  - Payment records should include variant_id in metadata
  - Should correctly link to user accounts
  - Should handle both new and existing users

### Cross-Reference Testing

- [ ] **Test 25: Data Mapping Verification**
  - Variant IDs in database should match site config
  - Product keys should be consistent across all systems
  - No orphaned or mismatched records

---

## 🚀 Performance & Load Tests

### API Performance

- [ ] **Test 26: API Response Times**
  - `fetchConfiguredLemonSqueezyProducts()` should be reasonably fast
  - Should handle multiple concurrent requests
  - Should cache appropriately

---

## 📖 Documentation Verification

### Documentation Accuracy

- [ ] **Test 27: Documentation Examples**
  - Examples in `docs/payments.mdx` should match actual configuration
  - All variant IDs should be real and valid
  - Troubleshooting guide should be accurate

---

## 🎯 Critical Success Criteria

**These are the most important tests - if any fail, the integration is broken:**

1. ✅ **API Connectivity**: Can fetch products and variants from LemonSqueezy
2. ✅ **Checkout URLs**: All buy buttons lead to correct LemonSqueezy checkout pages
3. 🔥 **Complete Purchase**: Can complete a full purchase flow successfully
4. 🔥 **Webhook Processing**: Webhooks create correct payment records
5. ✅ **Admin Visibility**: Payments appear correctly in admin panels
6. ✅ **User Verification**: Payment status correctly identifies paid users

---

## 🐛 Common Issues to Watch For

### Variant vs Product ID Confusion

- [ ] Ensure all checkout URLs use variant IDs (UUIDs), not product IDs (numbers)
- [ ] Check that webhooks record variant information, not just product information

### Configuration Mismatches

- [ ] Site config variant IDs should match actual LemonSqueezy variant IDs
- [ ] All pricing components should use the same product configuration

### Database Issues

- [ ] Payment records should include complete metadata
- [ ] User linking should work for both email and ID matching

---

## 🏁 Testing Complete

When all items above are checked ✅, your LemonSqueezy integration is fully functional and ready for production!

**Final Verification:**

- [ ] All critical tests pass
- [ ] No console errors related to LemonSqueezy
- [ ] Payment flow works end-to-end
- [ ] Admin panels display correct information
- [ ] Documentation is accurate and helpful

---

**Need Help?**
If any tests fail, check:

1. Console logs for error messages
2. Network tab for API request/response details
3. Database for payment record creation
4. LemonSqueezy webhook logs for delivery issues
