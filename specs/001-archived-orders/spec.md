# Feature Specification: Archived Orders

**Feature Branch**: `002-archived-orders`
**Created**: 2026-04-12
**Status**: Draft
**Input**: User description: "quero que os pedidos que tenham mais de 7 dias sejam colocados em uma rota '/archived' e os cards fiquem la"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Archived Orders (Priority: P1)

An operator navigates to the `/archived` route and sees all orders that were created more than 7 days ago, displayed as order cards in the same visual format used elsewhere in the system.

**Why this priority**: This is the core deliverable — the archived orders page must exist and display the correct data before anything else matters.

**Independent Test**: Can be fully tested by navigating to `/archived` after the system has orders older than 7 days, and verifying that those orders appear as cards on the page.

**Acceptance Scenarios**:

1. **Given** the operator is authenticated and there are orders older than 7 days, **When** they navigate to `/archived`, **Then** only orders with a creation date more than 7 days ago are displayed as order cards.
2. **Given** the operator is authenticated and there are no orders older than 7 days, **When** they navigate to `/archived`, **Then** an empty state message is displayed, informing the operator that there are no archived orders.
3. **Given** the operator is unauthenticated, **When** they navigate to `/archived`, **Then** they are redirected to the sign-in page.

---

### User Story 2 - Recent Orders Exclude Archived (Priority: P2)

An operator viewing the main orders page (home) sees only orders created within the last 7 days — orders older than 7 days no longer appear there.

**Why this priority**: The value of archiving is only fully realized when the main view is also cleaned up. Without this, the operator still sees old orders mixed with recent ones.

**Independent Test**: Can be fully tested by verifying that the home orders list does not display any order whose creation date is more than 7 days in the past.

**Acceptance Scenarios**:

1. **Given** the system has both recent and old orders, **When** the operator views the main orders page, **Then** only orders created within the last 7 days (inclusive) are shown.
2. **Given** all existing orders are older than 7 days, **When** the operator views the main orders page, **Then** the orders list is empty (or shows an appropriate empty state), and all orders appear on `/archived`.

---

### User Story 3 - Navigate to Archived Orders (Priority: P3)

An operator can navigate to the `/archived` route directly from the main navigation, without needing to manually type the URL.

**Why this priority**: Discoverability matters — without a navigation entry point, the page is effectively hidden from most users.

**Independent Test**: Can be fully tested by checking that at least one navigational affordance (link, menu item, or button) in the application leads to `/archived`.

**Acceptance Scenarios**:

1. **Given** the operator is on any page in the application, **When** they look for archived orders in the navigation, **Then** a clearly labeled link or menu entry for archived orders is visible and navigates them to `/archived`.

---

### Edge Cases

- What happens when an order is created exactly 7 days ago (boundary)? The system must apply a consistent rule: orders are archived only if their age is **strictly greater than** 7 full days (i.e., older than 7 × 24 hours from the current moment).
- What if the operator's session expires while viewing `/archived`? The system must redirect them to sign-in.
- What does the archived page show when the list is empty? An explicit empty-state message must be displayed.
- How are Brazilian-localized dates (day/month/year, PT-BR) preserved on the order cards in the archived view?
- What happens if the page is loaded and the network request fails? An error state must be displayed with a retry option.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a new protected route at `/archived` that is only accessible to authenticated users.
- **FR-002**: The `/archived` route MUST display order cards for all orders whose creation date is strictly more than 7 days before the current date and time.
- **FR-003**: The main orders view MUST exclude orders older than 7 days; only orders created within the last 7 days (inclusive) are shown there.
- **FR-004**: The order cards on `/archived` MUST present the same information and visual format as order cards used on other pages in the system.
- **FR-005**: The `/archived` page MUST display a clear empty-state message when there are no orders older than 7 days.
- **FR-006**: The `/archived` page MUST display a loading state while orders are being fetched.
- **FR-007**: The `/archived` page MUST display an error state with a retry affordance if the data request fails.
- **FR-008**: The system MUST preserve Brazilian-localized date, time, currency, and order status presentation on all cards shown in `/archived`.
- **FR-009**: A navigation entry point (link or menu item) labeled clearly as archived orders MUST be accessible from within the authenticated area of the application.

### Key Entities

- **Order**: Delivery order with status, total price, creation date/time, notes, payment method, and ordered products. The `created_at` (or equivalent) field is the basis for the 7-day archiving rule.
- **Order Card**: The UI component that visually represents a single order, reused across pages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of orders older than 7 days are absent from the main orders view and present on `/archived` after the feature is deployed.
- **SC-002**: The `/archived` page loads and displays order cards within the same time as any other orders page in the application.
- **SC-003**: The page correctly handles empty, loading, and error states — all three are visible during manual validation.
- **SC-004**: No regression is introduced in Brazilian localization for order status labels, currency formatting, or date/time display on any changed surface.
- **SC-005**: Unauthenticated access to `/archived` is redirected to sign-in in 100% of test attempts.
- **SC-006**: The application builds and passes linting and type-checking without errors after the feature is implemented.

## Assumptions

- The archiving rule is based solely on the order's creation date/time — status or other attributes do not affect whether an order is archived.
- The 7-day threshold is calculated from the current date/time at the time the page is loaded (not a scheduled batch job or backend flag).
- All existing order cards are reusable on the archived page without modification to their visual design.
- The existing authentication context and routing infrastructure support adding a new protected route without structural changes.
- The backend API already returns all orders with their creation timestamps; client-side filtering by date is sufficient unless the API provides a dedicated archived-orders endpoint.
- The `/archived` route is in Portuguese to match the application's target locale (Brazil).
