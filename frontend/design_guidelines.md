# IT Hardware Complaint Tracking System - Design Guidelines

## Design Approach
**System-Based Approach**: Using Material Design principles for this enterprise productivity application, emphasizing clarity, efficiency, and data-heavy interactions typical of IT service management tools.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Primary: 220 90% 50% (Professional blue for actions, navigation)
- Primary Dark: 220 90% 40% (Darker variant for depth)

**Status Colors:**
- Success: 140 70% 45% (Completed tickets, positive states)
- Warning: 38 90% 55% (In-progress, medium priority)
- Error: 0 75% 55% (Critical priority, overdue tickets)
- Info: 200 90% 60% (New tickets, informational states)

**Neutral Palette:**
- Background: 220 15% 97% (Light mode main background)
- Surface: 0 0% 100% (Card backgrounds, modals)
- Border: 220 15% 85% (Subtle borders, dividers)
- Text Primary: 220 15% 15% (Main text)
- Text Secondary: 220 10% 45% (Supporting text)

**Dark Mode:**
- Background: 220 15% 8% (Dark main background)
- Surface: 220 15% 12% (Dark card backgrounds)
- Border: 220 15% 20% (Dark borders)
- Text Primary: 220 15% 90% (Dark mode main text)

### B. Typography
**Font Family:** Inter (Google Fonts)
- **Headers:** Font weights 600-700, sizes 24px-32px
- **Body:** Font weight 400-500, sizes 14px-16px
- **Captions/Labels:** Font weight 500, size 12px-14px

### C. Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Consistent padding: p-4, p-6, p-8
- Margins: m-2, m-4, m-6
- Grid gaps: gap-4, gap-6

### D. Component Library

**Navigation:**
- Fixed sidebar (260px width) with collapsible mobile drawer
- Top navbar with breadcrumbs, user avatar, and notifications
- Role-based menu items with clear iconography

**Data Tables:**
- Striped rows with hover states
- Sticky headers for long lists
- Inline actions (view, edit, delete) with icon buttons
- Pagination with page size options

**Forms:**
- Consistent field spacing (mb-4)
- Label-input grouping with proper typography hierarchy
- Validation states with color-coded borders and messages
- Multi-column layouts for longer forms

**Cards & Modals:**
- Subtle shadows (shadow-sm, shadow-md)
- Rounded corners (rounded-lg)
- Modal overlays with backdrop blur
- Clear close actions and escape behaviors

**Status Indicators:**
- Badge components for ticket status
- Priority indicators with color coding
- Progress bars for completion tracking

**Role-Based UI Elements:**
- Staff: Simplified create/view interface
- Admin: Full CRUD operations with bulk actions
- Technician: Update-focused interface with time tracking

### E. Key Interface Patterns

**Dashboard Cards:**
- Metric cards with large numbers and trend indicators
- Recent activity feeds with timestamps
- Quick action buttons for common tasks

**Ticket Management:**
- List view with search and filter sidebar
- Quick status updates via dropdown actions
- Detail modal with tabbed sections (details, history, attachments)

**Responsive Behavior:**
- Mobile: Collapsible sidebar becomes overlay drawer
- Tablet: Condensed table columns with expandable rows
- Desktop: Full multi-column layouts with side panels

**Accessibility Features:**
- High contrast mode support
- Keyboard navigation for all interactive elements
- Screen reader compatible labels and descriptions
- Focus indicators that work in both light and dark modes

This design system prioritizes data visibility, efficient workflows, and role-appropriate interfaces while maintaining a professional, trustworthy appearance suitable for IT service management.