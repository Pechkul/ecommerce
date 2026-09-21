# POS Exchange Product Workflow

## 1. Objective

Design a scalable POS exchange flow that supports:

- exchange at the counter as `Return + New Sale`
- online and offline POS usage
- safe sync from IndexedDB to backend
- reuse of existing Bagisto Sales and RMA capabilities where they fit

This document is based on the current code in the POS module, Sales module, and RMA module.

---

## 2. Current System Analysis

### 2.1 POS Frontend and IndexedDB

Current POS behavior:

- The active cart only supports positive sale items.
- Product quantities are normalized to `>= 1`.
- Cart totals are built as `subtotal + tax - discount`.
- Payment flow assumes a sale collection flow, not a refund payout flow.
- Offline orders are stored as full snapshots in IndexedDB and synced later.
- Offline return is currently a boolean-style flow on the whole offline order, not a true line-level exchange transaction.

Relevant observations:

- `src/Resources/assets/js/helpers/price.js`
  - quantity is normalized to at least `1`
- `src/Resources/assets/js/helpers/Cart.js`
  - cart totals assume positive items only
- `src/Resources/assets/js/components/secured/Payment.vue`
  - payment UI expects payable amount collection
- `src/Resources/assets/js/components/secured/orders/Offline.vue`
  - offline return marks `isReturned`, then sync later creates sale and full refund
- `src/Resources/assets/js/composable/offline-sync.js`
  - sync logic handles offline sale first and optional full refund after sync

Implication:

- Negative cart lines are not a good fit for the current POS cart.
- Exchange should not be implemented by forcing returned products into the same cart as negative quantities.

### 2.2 POS Order Sync

Current offline sync:

- offline order is stored in IndexedDB
- sync uses `syncOrder`
- if order is marked returned, POS then calls `returnOrder` after the synced sale exists

Implication:

- Current sync model is already "sale first, then optional refund"
- but it is too limited for exchange because:
  - it does not support partial return lines
  - it does not support linking old order to new sale
  - it does not support payment settlement differences
  - it does not protect against exchange-specific conflicts

### 2.3 Backend Order System

Current backend order path:

- POS creates a normal Bagisto Sales order
- POS immediately creates invoice
- POS creates shipment for stockable items
- POS creates POS-specific order row in `pos_order`
- POS creates customer credit row in `pos_customer_credit`

Relevant observations:

- `src/Mutations/Outlet/OrderMutation.php`
  - builds a normal Sales order payload
- `src/Repositories/OrderRepository.php`
  - creates invoice, shipment, optional refund for `is_returned`
- `../Sales/src/Models/Order.php`
  - refund eligibility is based on `qty_to_refund`
- `../Sales/src/Repositories/RefundRepository.php`
  - refund updates order totals and restores inventory
- `../Sales/src/Repositories/RefundItemRepository.php`
  - inventory is returned correctly on refund

Implication:

- Backend already has strong support for:
  - order creation
  - shipment/invoice
  - refund
  - inventory restore
- This should be reused instead of inventing a separate return engine in POS.

### 2.4 Current Return Behavior

Current POS online return:

- UI sends returnable item list
- backend uses refund repository
- order item refunded quantities prevent over-refund

Current POS limitation:

- UI currently refunds all remaining returnable quantities in common paths
- there is no dedicated exchange transaction model

### 2.5 RMA Module

What RMA already provides:

- RMA request entity and status lifecycle
- per-order-item quantity tracking
- return window logic using `rma_return_period`
- reason and resolution catalogs
- protection against double RMA quantity creation
- admin/shop workflow for approval and processing

Important constraints in current RMA implementation:

- RMA resolutions are only:
  - `return`
  - `cancel_items`
- There is no native `exchange` resolution.
- Controllers are HTTP admin/shop flows, not POS GraphQL flows.
- Current creation flow creates one `rma_item` per request.
- `RMA` model currently exposes `item()` as `hasOne`, even though the table shape allows multiple rows.
- RMA status flow is asynchronous and approval-oriented, while POS exchange must complete immediately at the counter.

Relevant observations:

- `../RMA/src/Enums/DefaultRMAResolution.php`
- `../RMA/src/Helpers/Helper.php`
- `../Admin/src/Http/Controllers/Sales/RMA/RequestController.php`
- `../Shop/src/Http/Controllers/Customer/Account/RMAController.php`

Implication:

- RMA cannot be used as the primary transaction engine for POS exchange.
- RMA can still be reused for:
  - eligibility logic
  - reasons
  - optional audit trail

---

## 3. Final Approach

### Recommended Architecture: Hybrid, POS-led

Implement exchange as a dedicated POS transaction that orchestrates:

1. return validation on the original order
2. refund creation on selected old order items
3. new sale creation using existing POS add-to-cart and order creation flow
4. exchange linking and settlement tracking

RMA should be reused selectively, not as the main engine.

### Why this is the best fit

#### Do not use negative cart items

Not recommended because:

- current cart only supports positive quantities
- payment flow assumes sale collection, not negative settlement
- tax/discount logic is sale-oriented
- product type helpers assume normal sale preparation

#### Do not use pure RMA-based exchange

Not recommended because:

- RMA is approval/workflow oriented, not counter-sale oriented
- no POS GraphQL/API support exists today
- no offline support exists today
- no native `exchange` resolution exists
- current RMA request flow is effectively single-item per request

#### Use POS-native exchange with RMA reuse

Recommended because:

- refund and inventory logic already exist in Sales
- order creation and POS payment already exist
- IndexedDB offline model can be extended cleanly
- POS can keep exchange UX fast and immediate
- RMA metadata can still be reused where needed

---

## 4. Direct Answers to the Key Questions

### 4.1 How should exchange be implemented?

Use `Return + New Sale`, not negative cart items.

Recommended flow:

- return lines are selected from the original order in a dedicated exchange screen
- replacement items are added through the existing cart flow
- backend executes refund + new order + exchange link

### 4.2 How to manage return quantity tracking and duplicate returns?

Use these sources of truth:

- `order_items.qty_invoiced`
- `order_items.qty_refunded`
- optional pending RMA quantities
- pending offline exchange reservations on the current device

Eligible quantity formula:

`eligible_qty = qty_invoiced - qty_refunded - pending_local_exchange_qty - pending_rma_qty`

Notes:

- backend remains the final authority
- offline mode can only prevent duplicates on the same device
- cross-device duplicate prevention is only guaranteed at sync time

### 4.3 How to handle inventory?

Use the existing Sales refund and order inventory logic.

- returned item:
  - inventory is restored by refund flow
- new replacement item:
  - inventory is deducted by new order shipment/invoice flow

For offline mode:

- mirror the same inventory effect in IndexedDB immediately
- net result per product should be:
  - `+ returned qty`
  - `- replacement qty`

### 4.4 How to handle payment?

Settlement should be based on:

`exchange_balance = replacement_sale_total - return_credit_total`

Cases:

- `> 0`: customer pays extra
- `= 0`: no payment needed
- `< 0`: refund due to customer

Important:

- current `Payment.vue` only supports collection
- refund payout UI must be added for exchange

### 4.5 How to support offline mode?

Use dedicated IndexedDB exchange storage.

- no API calls during exchange creation
- validate using local `orders`, `products`, `customers`, `agent`, and outlet inventory data
- sync later using a dedicated atomic backend mutation

### 4.6 How to link old order and exchange order?

Create a dedicated exchange record.

Recommended link:

- `original_order_id`
- `exchange_order_id`
- returned item rows
- settlement summary

Do not rely only on notes or loose references.

---

## 5. Flow Design

### 5.1 POS UI Flow

#### Entry point

- Add `Exchange` action in order history detail for synced orders
- Do not allow exchange on unsynced `offline_orders` in MVP

#### Step 1: Start exchange session

- cashier opens an order
- POS loads returnable lines from local order snapshot
- POS displays:
  - item name
  - ordered qty
  - refunded qty
  - eligible exchange qty
  - unit price snapshot

#### Step 2: Select return items

- cashier chooses quantities to return
- optional reason selection can reuse RMA reason catalog for `return`
- POS calculates return credit from original order item price/tax/discount snapshot

#### Step 3: Add replacement items

- replacement side uses existing product listing and add-to-cart flow
- returned lines are not added to cart
- only replacement sale lines go into the cart

#### Step 4: Settlement review

Show summary:

- return credit
- new sale subtotal/tax/discount/grand total
- net balance

#### Step 5: Payment outcome

- if balance > 0:
  - collect extra payment
- if balance = 0:
  - confirm exchange directly
- if balance < 0:
  - record refund payout method and amount

#### Step 6: Completion

- create exchange record
- clear exchange context
- keep normal cart clean
- show success with:
  - original order reference
  - exchange order reference
  - refund/extra payment result

### 5.2 Backend Flow

#### Online exchange

1. validate source order belongs to outlet and is exchange-eligible
2. validate selected return quantities against live order state
3. validate replacement sale items with current inventory
4. compute return credit from original order items
5. compute sale total from new cart payload
6. validate settlement input
7. within one orchestration service:
   - create refund for old order
   - create new sales order through reusable POS order creation service
   - create POS exchange link record
   - optionally create RMA audit record
8. return both updated original order and new exchange order

#### Offline sync exchange

1. client sends stored exchange payload
2. backend revalidates original order quantities and replacement items
3. backend rejects if order state changed or qty is no longer available
4. if valid, backend executes same exchange orchestration transaction
5. client marks exchange as synced and updates local order cache

---

## 6. Required Changes

### 6.1 POS Frontend

#### New exchange context

Add a dedicated exchange session model separate from cart items.

Recommended local structure:

- `sourceOrderId`
- `sourceOutletOrderId`
- `customer`
- `returnItems[]`
- `replacementCartId`
- `settlement`
- `status`

#### Cart changes

Do not change cart to support negative lines.

Instead:

- keep cart for replacement sale items only
- store return selection separately
- show a combined exchange summary screen

#### UI changes

Required screens/components:

- exchange action in order detail
- exchange workspace:
  - return panel
  - replacement cart panel
  - settlement summary
- refund payout UI
- exchange success summary
- exchange conflict/failure view for offline sync

#### IndexedDB changes

Add new stores:

- `exchange_sessions`
  - working draft while cashier is building exchange
- `offline_exchanges`
  - finalized offline exchanges waiting for sync

Optional:

- `exchange_return_reservations`
  - if local duplicate prevention should be isolated from drafts

#### Sync changes

Add a new sync path:

- `syncExchange`

Do not piggyback exchange on current `syncOrder + isReturned` design.

### 6.2 Backend Laravel

#### New service layer

Refactor current order creation so exchange can reuse it safely.

Recommended services:

- `CreatePosOrderService`
- `CalculateExchangeService`
- `ProcessExchangeService`
- `ValidateExchangeEligibilityService`

Reason:

- current order creation logic is still concentrated in GraphQL mutation classes
- exchange needs the same order creation logic without duplicating it

#### New API

Recommended GraphQL additions:

- query `getExchangeEligibility(orderId)`
- mutation `createExchange(input)`
- mutation `syncExchange(input)`

Recommended response shape:

- original order after refund
- new exchange order
- exchange metadata
- settlement summary

#### Validation rules

Backend must validate:

- original order belongs to same outlet
- order item exists and is refundable
- quantity does not exceed `qty_to_refund`
- replacement product exists and is saleable
- replacement inventory is available
- customer still exists
- outlet and agent are valid

### 6.3 RMA Integration

#### What can be reused

- `rma_return_period` snapshot already stored on order items
- RMA helper logic for eligible return items
- reason catalog
- status catalog
- optional conversation/audit behavior if business wants it

#### What cannot be reused as-is

- no exchange resolution
- no POS GraphQL API
- no offline support
- no true multi-item request flow in current controller/model usage
- workflow is manual/admin-oriented instead of instant POS settlement

#### Recommended RMA strategy

Use one of these two modes:

##### MVP

- do not create RMA during POS exchange
- only reuse RMA eligibility concepts and reasons if needed

##### Advanced

- auto-create audit RMA record(s) for exchanged returned lines
- mark them as POS-generated
- optionally auto-transition to accepted/received states

#### RMA changes needed for deep integration

If deep RMA integration is desired:

- add new resolution type `exchange`
- change `RMA::item()` to proper multi-item support if business wants one request for multiple lines
- add POS-facing API endpoints
- add link from RMA to exchange transaction
- add outlet/agent metadata for POS-originated RMAs

---

## 7. Data Structure Changes

### 7.1 Recommended database additions

#### `pos_exchanges`

Purpose:

- master record for one exchange transaction

Suggested columns:

- `id`
- `uuid`
- `original_order_id`
- `exchange_order_id` nullable until new order is created
- `original_pos_order_id` nullable
- `exchange_pos_order_id` nullable
- `outlet_id`
- `user_id`
- `customer_id`
- `source` enum: `online`, `offline`
- `status` enum: `draft`, `pending_sync`, `processing`, `completed`, `failed`, `conflict`, `cancelled`
- `return_total`
- `base_return_total`
- `sale_total`
- `base_sale_total`
- `balance_total`
- `base_balance_total`
- `balance_direction` enum: `collect`, `refund`, `even`
- `payment_mode` nullable
- `refund_mode` nullable
- `offline_reference` nullable
- `failure_reason` nullable
- `meta` json nullable
- timestamps

#### `pos_exchange_items`

Purpose:

- audit and validation rows for returned items

Suggested columns:

- `id`
- `pos_exchange_id`
- `order_item_id`
- `product_id`
- `variant_id` nullable
- `qty_requested`
- `qty_processed`
- `base_price`
- `base_tax_amount`
- `base_discount_amount`
- `resolution_reason_id` nullable
- `rma_id` nullable
- `meta` json nullable
- timestamps

### 7.2 Suggested IndexedDB additions

#### `exchange_sessions`

- draft working state

#### `offline_exchanges`

- finalized offline exchange payload waiting for sync

Suggested payload:

- `uuid`
- `outlet_id`
- `agent_id`
- `source_order_id`
- `source_outlet_order_id`
- `customer`
- `return_items`
- `replacement_order_input`
- `settlement`
- `status`
- `created_at`
- `updated_at`

### 7.3 Fields that should not be added to core Sales tables unless necessary

Avoid adding `qty_returned` or `exchange_parent_id` directly to core `orders` and `order_items` in MVP.

Reason:

- `qty_refunded` already exists and is authoritative for completed returns
- exchange linkage belongs to POS transaction metadata
- dedicated POS exchange tables keep the scope cleaner

Optional shortcut:

- add nullable `pos_exchange_id` to `pos_order` for easier lookup

---

## 8. Offline and Sync Strategy

### 8.1 Offline eligibility rules

Offline exchange should only be allowed for orders already present in local `orders` store.

MVP rule:

- allow exchange only for synced orders
- do not allow exchange for local `offline_orders` that are not yet synced

Reason:

- refund requires stable backend `order_id` and `order_item_id`
- unsynced offline sales do not yet have authoritative backend return targets

### 8.2 Offline exchange creation

When cashier confirms offline exchange:

1. validate original order from local `orders`
2. validate return quantities against local refunded state and local pending exchanges
3. validate replacement items using local `products`
4. compute settlement locally
5. save exchange record to `offline_exchanges`
6. update local inventory immediately
7. update local order cache optimistically if desired

### 8.3 Sync behavior

Sync must be atomic.

Recommended:

- one backend mutation processes full exchange
- do not sync refund and new sale as two unrelated independent jobs

Why:

- prevents half-applied exchange
- keeps original order and new order linkage consistent
- simplifies conflict handling

### 8.4 Sync conflict handling

Possible conflicts:

- item already refunded elsewhere
- replacement product now out of stock
- customer deleted
- outlet changed

Conflict result:

- mark local exchange as `conflict` or `failed`
- preserve payload for manual retry/review
- do not silently downgrade to plain sale or plain refund

---

## 9. Edge Cases

### 9.1 Partial return

Supported.

- cashier can return selected quantities only
- replacement sale can be any set of products

### 9.2 Same product exchanged for same product

Supported.

- return and sale still remain separate accounting events
- inventory net effect may be zero

### 9.3 Product not available now

Behavior:

- return can still proceed
- replacement item must be blocked if not saleable or out of stock

### 9.4 Price or tax changed since original purchase

Rule:

- return credit uses original order item amounts
- replacement sale uses current cart/product pricing

This is required for accounting correctness.

### 9.5 Duplicate return attempts

Prevent by:

- backend `qty_to_refund` validation
- optional pending RMA quantity checks
- local offline reservation checks

### 9.6 Customer missing locally

Behavior:

- exchange should stop if original customer cannot be resolved locally and customer assignment is mandatory for POS

### 9.7 Refund due to customer

Current payment flow does not support refund payout recording well.

MVP recommendation:

- support cash refund only

Advanced:

- support card reversal/manual card refund/store credit

### 9.8 Unsynced offline order selected for exchange

Do not support in MVP.

Recommended behavior:

- ask cashier to sync sale first
- or void/edit the pending offline order instead of exchanging it

### 9.9 Multi-device offline returns

Cannot be fully prevented offline.

Mitigation:

- backend conflict detection at sync time
- local failed exchange recovery UI

---

## 10. Risks and Limitations

### 10.1 Technical risks

- current order creation logic is mutation-centric and should be refactored before exchange
- current payment flow is charge-only and needs settlement expansion
- offline sync today is not atomic for exchange semantics
- local inventory accuracy depends on prior sync quality

### 10.2 Data consistency risks

- cross-device offline duplicate returns
- replacement stock may change before sync
- if refund and sale are not orchestrated atomically, data can diverge

### 10.3 UX risks

- exchange UI can become confusing if return and new sale are mixed into one cart list
- settlement explanation must be explicit
- failure recovery for offline sync must be visible to cashier

### 10.4 RMA integration risk

- deep RMA integration will expand scope significantly
- current RMA module needs API and data-model adjustments for POS-grade exchange

---

## 11. Implementation Phases

### Phase 1: MVP Exchange for Online Synced Orders

Scope:

- exchange only from synced order history
- no RMA record creation
- partial returns supported
- replacement items added via existing cart flow
- backend `createExchange` mutation
- new `pos_exchanges` and `pos_exchange_items`
- cash-only refund payout if balance is negative

Why:

- lowest-risk path
- uses existing Sales refund/order logic
- avoids offline and RMA complexity initially

### Phase 2: Offline Exchange Support

Scope:

- IndexedDB exchange stores
- `syncExchange` mutation
- local inventory updates
- conflict handling and retry UI

Why:

- offline support is important for POS, but should not be built before exchange transaction rules are stable online

### Phase 3: Reporting and Order Linking

Scope:

- show exchange badge/history in POS and admin
- link old order and new exchange order
- exchange filters in reports

### Phase 4: Optional RMA Audit Integration

Scope:

- auto-create RMA audit entries for POS exchange returns
- reuse reasons/statuses
- add `exchange` resolution if business wants formal RMA representation

### Phase 5: Advanced Settlement

Scope:

- card refund tracking
- mixed refund modes
- store credit support
- richer approval rules if required

---

## 12. Recommended MVP Boundaries

To keep implementation safe and POS-friendly, MVP should include:

- synced orders only
- partial return quantity selection
- replacement sale via existing cart
- atomic backend exchange mutation
- dedicated exchange tables
- no negative cart lines
- no deep RMA dependency
- no exchange on unsynced local offline orders

---

## 13. Final Recommendation

Build exchange as a dedicated POS transaction layer on top of existing Bagisto Sales order/refund mechanics.

Use:

- Sales order creation for the new sale
- Sales refund for the returned lines
- POS-specific exchange tables for linking and audit
- IndexedDB exchange stores for offline support
- RMA rules, reasons, and return-window concepts only where useful

Do not use:

- negative cart items
- pure RMA workflow as the primary POS exchange engine

This gives the cleanest path for:

- immediate POS usability
- offline compatibility
- accounting correctness
- future RMA/reporting integration
