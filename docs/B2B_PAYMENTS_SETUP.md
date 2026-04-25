# B2B Payments Setup

This project now has a subscription prompt for authenticated users. It appears after login for users without a paid plan and repeats at most once every 7 days. To make it a real B2B payment flow, replace the demo values below with your production provider data.

## Where To Enter Your Data

### `frontend/UPLAN/.env`

Use this file for client-safe values only:

```env
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
VITE_STRIPE_B2B_PRICE_ID=price_your_b2b_plan_price_id
VITE_STRIPE_CHECKOUT_URL=https://buy.stripe.com/your_checkout_link
VITE_STRIPE_CUSTOMER_PORTAL_URL=https://billing.stripe.com/p/login/your_portal_link
VITE_UNIVERSITY_PLAN_CONTACT_URL=https://yourdomain.com/contact-sales
```

### `backend/.env`

Use this file for private server-side payment secrets:

```env
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_B2B_PRICE_ID=price_your_b2b_plan_price_id
STRIPE_SUCCESS_URL=https://your-frontend-domain.com/?payment=success
STRIPE_CANCEL_URL=https://your-frontend-domain.com/?payment=cancelled
STRIPE_CUSTOMER_PORTAL_RETURN_URL=https://your-frontend-domain.com/
```

Never put `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` in any `VITE_*` frontend variable.

## Business Data You Need For Real B2B

Store this data in your backend database when you add the payment API endpoints:

- Organization: legal company name, address, country, VAT/tax ID
- Buyer: billing contact name, billing email, phone number
- Subscription: Stripe customer ID, subscription ID, price ID, seat count, status
- Invoices: invoice ID, invoice URL, amount, currency, paid/unpaid status
- Access control: organization owner, admins, members, paid seat limits

## Recommended Production Flow

1. User logs in.
2. If the user has no paid subscription, the subscription prompt appears once every 7 days.
3. The free plan keeps the user in the app and records `subscriptionPlan=free` in user-local storage.
4. The Pro plan redirects to `VITE_STRIPE_CHECKOUT_URL`.
5. The University / Center plan redirects to `VITE_UNIVERSITY_PLAN_CONTACT_URL`, or falls back to `VITE_STRIPE_CHECKOUT_URL`.
6. In production, backend webhooks should update the real subscription status in the database.
7. If the backend says the user has `pro` or `university`, do not show the weekly prompt.

## Files Changed For The Payment Design

- `frontend/UPLAN/src/components/SubscriptionPrompt.tsx`
- `frontend/UPLAN/src/App.tsx`
- `frontend/UPLAN/.env.example`
- `backend/.env.example`
- `.env.example`
