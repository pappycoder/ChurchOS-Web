"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function PermBadge({ perm }: { perm: string }) {
  const action = perm.split(":")[1];
  const color =
    action === "create"
      ? "bg-green-100 text-green-800 border-green-200"
      : action === "read"
        ? "bg-blue-100 text-blue-800 border-blue-200"
        : action === "update"
          ? "bg-amber-100 text-amber-800 border-amber-200"
          : "bg-red-100 text-red-800 border-red-200";
  return (
    <code className={`rounded border px-1.5 py-0.5 text-xs font-mono ${color}`}>
      {perm}
    </code>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} data-docs-section className="scroll-mt-28 space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function ActionTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Button</th>
            <th className="pb-2 pr-4 font-medium">Description</th>
            <th className="pb-2 font-medium">Permission</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([btn, desc, perm]) => (
            <tr key={btn} className="border-b last:border-0">
              <td className="py-2.5 pr-4 font-medium whitespace-nowrap">{btn}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">{desc}</td>
              <td className="py-2.5">
                <PermBadge perm={perm} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PageTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Page</th>
            <th className="pb-2 pr-4 font-medium">Route</th>
            <th className="pb-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([page, route, desc]) => (
            <tr key={page} className="border-b last:border-0">
              <td className="py-2.5 pr-4 font-medium whitespace-nowrap">{page}</td>
              <td className="py-2.5 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                  {route}
                </code>
              </td>
              <td className="py-2.5 text-muted-foreground">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilterTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Filter / Sort</th>
            <th className="pb-2 font-medium">Options</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([filter, opts]) => (
            <tr key={filter} className="border-b last:border-0">
              <td className="py-2.5 pr-4 font-medium whitespace-nowrap">{filter}</td>
              <td className="py-2.5 text-muted-foreground">{opts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocsContent() {
  return (
    <>
      {/* ─── Getting Started ──────────────────────────── */}
      <Section id="getting-started" title="Getting Started">
        <Card>
          <CardHeader>
            <CardTitle>What is ChurchOS?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              ChurchOS is a comprehensive church management system designed to help
              churches manage their members, visitors, attendance, giving, events, and
              administration — all from a single dashboard.
            </p>
            <p>
              The system is role-based: each user sees only the pages and actions their
              role permits. Your role determines which sidebar links appear and which
              buttons are enabled.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>
              The sidebar is organized into sections. Click a section to expand it and
              see its sub-pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>Main Menu</strong> — Members, Attendance, Giving, Events, Visitors
              (and more as they are built)
            </p>
            <p>
              <strong>Communication</strong> — Templates, Broadcasts, Messages
            </p>
            <p>
              <strong>Operations</strong> — Departments, Assets, Forms, Reports
            </p>
            <p>
              <strong>Administration</strong> — User Management, Church Settings, Analytics
            </p>
            <p>
              <strong>Support</strong> — Help &amp; Documentation (this page)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How Permissions Work</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Every action in ChurchOS is gated by a <strong>permission</strong>. Permissions
              follow the pattern <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">resource:action</code> —
              for example <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">members:create</code> or{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">events:delete</code>.
            </p>
            <p>
              Four actions exist: <PermBadge perm="resource:create" />{" "}
              <PermBadge perm="resource:read" />{" "}
              <PermBadge perm="resource:update" />{" "}
              <PermBadge perm="resource:delete" />.
            </p>
            <p>
              Permissions are assigned through <strong>roles</strong>. Each user can have
              multiple roles, and permissions accumulate across all assigned roles. The{" "}
              <strong>super_admin</strong> role has all permissions and cannot be modified.
            </p>
            <p>
              If you lack a permission, the corresponding button will be hidden or disabled,
              and the page will show an &quot;Access Denied&quot; message.
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* ─── Members ──────────────────────────────────── */}
      <Section id="members" title="Members">
        <Card>
          <CardHeader>
            <CardTitle>Members Module</CardTitle>
            <CardDescription>
              Manage your church&apos;s member directory — profiles, contact info,
              attendance history, and giving records.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <PageTable
              rows={[
                ["Members List", "/members", "View, search, filter, and manage all church members"],
                ["Add Member", "/members/new", "Full-page form to create a new member with photo, personal info, address, family, and custom fields"],
                ["Member Detail", "/members/[memberId]", "View a member's profile, contact info, giving history, attendance history, and notes"],
                ["Import Members", "/members/import", "Bulk import members from a CSV/Excel file with field mapping and validation"],
                ["Families", "/members/families", "List and manage family groups"],
                ["Family Detail", "/members/families/[familyId]", "View family members, add/remove members, set head of household"],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionTable
              rows={[
                [
                  "Add Member",
                  "Opens full-page form to create a new member with photo, personal info, address, family, and custom fields",
                  "members:create",
                ],
                [
                  "Quick Add",
                  "Opens inline dialog for fast member creation (names, email, phone only)",
                  "members:create",
                ],
                [
                  "Export",
                  "Downloads selected (or all filtered) rows as CSV, PDF, or XLSX",
                  "members:read",
                ],
                [
                  "Edit",
                  "Opens edit dialog pre-filled with member data",
                  "members:update",
                ],
                [
                  "Restore to Active",
                  "Reactivates a previously deactivated member",
                  "members:update",
                ],
                [
                  "Deactivate",
                  "Soft-deactivates the member (can be restored later)",
                  "members:delete",
                ],
                [
                  "Deactivate Selected",
                  "Batch deactivates all selected members (sequential with progress)",
                  "members:delete",
                ],
                [
                  "Import Members",
                  "Upload CSV/Excel, map fields, preview, and commit bulk import",
                  "members:create",
                ],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filters &amp; Sort</CardTitle>
          </CardHeader>
          <CardContent>
            <FilterTable
              rows={[
                ["Search", "Server-side search by name, email, or phone"],
                ["Status", "active / inactive / suspended / transferred"],
                ["Branch", "Filter by church branch"],
                ["Sort by", "First Name, Last Name, Member Since, Date Added (+ asc/desc toggle)"],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Families ─────────────────────────────────── */}
      <Section id="families" title="Families">
        <Card>
          <CardHeader>
            <CardTitle>Families Module</CardTitle>
            <CardDescription>
              Group members into family units. Each family can have a designated head
              of household and linked members with relationship types.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <PageTable
              rows={[
                ["Families List", "/members/families", "View and manage all family groups"],
                ["Family Detail", "/members/families/[familyId]", "View family members, add/remove members, set head of household"],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionTable
              rows={[
                [
                  "Add Family",
                  "Opens dialog to create a new family (name + optional head of household)",
                  "families:create",
                ],
                [
                  "Edit",
                  "Opens edit dialog pre-filled with family data",
                  "families:update",
                ],
                [
                  "Add Member",
                  "Link an existing member to the family with a relationship type",
                  "families:update",
                ],
                [
                  "Remove Member",
                  "Unlink a member from the family (member record is kept)",
                  "families:update",
                ],
                [
                  "Delete",
                  "Permanently deletes the family (member records are kept)",
                  "families:delete",
                ],
                [
                  "Export",
                  "Downloads selected (or all filtered) families as CSV/PDF/XLSX",
                  "families:read",
                ],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Visitors ─────────────────────────────────── */}
      <Section id="visitors" title="Visitors">
        <Card>
          <CardHeader>
            <CardTitle>Visitors Module</CardTitle>
            <CardDescription>
              Track church visitors, manage follow-up workflows, and convert visitors
              into members. Includes a kanban-style follow-up board with drag-and-drop.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <PageTable
              rows={[
                ["Visitors List", "/visitors", "View, search, filter, and manage all visitors"],
                ["Add Visitor", "/visitors/new", "Full-page form with personal info, visit date, follow-up status, and custom fields"],
                ["Visitor Detail", "/visitors/[visitorId]", "View visitor profile, contact info, follow-up status, visit history, and convert to member"],
                ["Follow-Up Board", "/visitors/follow-up", "Kanban board with drag-and-drop to move visitors through follow-up stages"],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionTable
              rows={[
                [
                  "Quick Add",
                  "Opens inline dialog for fast visitor creation",
                  "visitors:create",
                ],
                [
                  "Add Visitor",
                  "Opens full-page form with personal info, visit date, follow-up status, and custom fields",
                  "visitors:create",
                ],
                [
                  "Edit",
                  "Opens edit dialog pre-filled with visitor data",
                  "visitors:update",
                ],
                [
                  "Convert to Member",
                  "Converts the visitor into a church member (creates a new member record)",
                  "visitors:update",
                ],
                [
                  "Update Status",
                  "Inline status dropdown on detail page — changes follow-up stage (optimistic update)",
                  "visitors:update",
                ],
                [
                  "Drag & Drop",
                  "On the follow-up board, drag cards between columns to change status",
                  "visitors:update",
                ],
                [
                  "Delete",
                  "Permanently deletes the visitor record",
                  "visitors:delete",
                ],
                [
                  "Export",
                  "Downloads selected (or all filtered) visitors as CSV/PDF/XLSX",
                  "visitors:read",
                ],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-Up Statuses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "New", color: "bg-blue-100 text-blue-800" },
                { label: "Contacted", color: "bg-purple-100 text-purple-800" },
                { label: "Follow-Up Scheduled", color: "bg-amber-100 text-amber-800" },
                { label: "Interested", color: "bg-green-100 text-green-800" },
                { label: "Became Member", color: "bg-emerald-100 text-emerald-800" },
                { label: "Not Interested", color: "bg-gray-100 text-gray-800" },
              ].map((s) => (
                <Badge key={s.label} variant="secondary" className={s.color}>
                  {s.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ─── Attendance ───────────────────────────────── */}
      <Section id="attendance" title="Attendance">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Module</CardTitle>
            <CardDescription>
              Record and track service attendance, manage recurring services, and
              generate attendance reports. Supports both member check-in and walk-in
              visitors.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <PageTable
              rows={[
                ["Dashboard", "/attendance", "Overview with stats cards, 30-day trend chart, and recent check-ins"],
                ["Services", "/attendance/services", "Manage recurring services (name, day, time, category, active status)"],
                ["Service Detail", "/attendance/services/[serviceId]", "Service stats, attendance breakdown, and per-category giving chart"],
                ["Check-In", "/attendance/check-in", "Bulk member check-in from roster or walk-in visitor registration"],
                ["Records", "/attendance/records", "Full attendance records with service, category, date-range filters"],
                ["Reports", "/attendance/reports", "Attendance trends, by-service breakdown, gender split, and source analysis"],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionTable
              rows={[
                [
                  "Add Service",
                  "Opens dialog to create a new recurring service (name, category, day, time, active toggle)",
                  "attendance:create",
                ],
                [
                  "Edit Service",
                  "Opens edit dialog pre-filled with service data",
                  "attendance:update",
                ],
                [
                  "Activate / Deactivate",
                  "Toggle a service's active status",
                  "attendance:update",
                ],
                [
                  "Delete Service",
                  "Permanently deletes the service (blocked if attendance records exist)",
                  "attendance:delete",
                ],
                [
                  "Bulk Check-In",
                  "Select members from roster, check in all selected at once",
                  "attendance:create",
                ],
                [
                  "Walk-In Check-In",
                  "Register a walk-in visitor and record their attendance in one step",
                  "attendance:create",
                ],
                [
                  "Delete Record",
                  "Remove an attendance record",
                  "attendance:delete",
                ],
                [
                  "Export",
                  "Downloads attendance records as CSV",
                  "attendance:read",
                ],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filters &amp; Sort</CardTitle>
          </CardHeader>
          <CardContent>
            <FilterTable
              rows={[
                ["Service", "Filter by specific service"],
                ["Category", "adult / children"],
                ["Date Range", "Start and end date pickers"],
                ["Sort (Records)", "Date/time, name, service"],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Giving ───────────────────────────────────── */}
      <Section id="giving" title="Giving">
        <Card>
          <CardHeader>
            <CardTitle>Giving Module</CardTitle>
            <CardDescription>
              Track donations, manage giving categories, generate receipts, and
              monitor recurring giving schedules. Supports cash and bank transfer
              methods with flexible linking to members, services, or events.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <PageTable
              rows={[
                ["Dashboard", "/giving", "Overview with monthly/all-time totals, 30-day trend chart, and recent gifts"],
                ["Categories", "/giving/categories", "Manage giving categories (name, description, display order, active status)"],
                ["Records", "/giving/records", "Full giving records with category, status, method, service, and date-range filters"],
                ["Reports", "/giving/reports", "Giving trends by category, by method, with date range and export"],
                ["Recurring Giving", "/giving/recurring", "Manage recurring giving schedules (pause, resume, cancel)"],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionTable
              rows={[
                [
                  "Record Cash",
                  "Opens dialog to record a giving transaction — amount, method (cash/bank transfer), link to General/Member/Service/Event, category, notes",
                  "giving:create",
                ],
                [
                  "Add Category",
                  "Opens dialog to create a new giving category (name, description, display order, active toggle)",
                  "giving:create",
                ],
                [
                  "Edit Category",
                  "Opens edit dialog pre-filled with category data",
                  "giving:update",
                ],
                [
                  "Deactivate Category",
                  "Soft-deactivates the category (existing records are kept)",
                  "giving:delete",
                ],
                [
                  "Download PDF",
                  "Generates and downloads a receipt PDF for a giving record",
                  "giving:read",
                ],
                [
                  "Send to Giver",
                  "Sends the receipt via WhatsApp or Email",
                  "giving:read",
                ],
                [
                  "Pause Recurring",
                  "Pauses a recurring giving schedule",
                  "giving:update",
                ],
                [
                  "Resume Recurring",
                  "Resumes a paused recurring giving schedule",
                  "giving:update",
                ],
                [
                  "Cancel Recurring",
                  "Permanently cancels a recurring giving schedule",
                  "giving:update",
                ],
                [
                  "Export",
                  "Downloads giving records as CSV/PDF/XLSX",
                  "giving:read",
                ],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filters &amp; Sort</CardTitle>
          </CardHeader>
          <CardContent>
            <FilterTable
              rows={[
                ["Category", "Filter by giving category"],
                ["Status", "paid / pending / failed / refunded"],
                ["Method", "cash / bank_transfer"],
                ["Service", "Filter by linked service"],
                ["Date Range", "Start and end date pickers"],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Events ───────────────────────────────────── */}
      <Section id="events" title="Events">
        <Card>
          <CardHeader>
            <CardTitle>Events Module</CardTitle>
            <CardDescription>
              Plan and manage church events with a visual calendar, registration
              tracking, event check-in, and a full ticketing system with tier
              management and PDF ticket generation.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <PageTable
              rows={[
                ["Calendar Dashboard", "/events", "Visual calendar with month/week/day views, upcoming events sidebar, and quick-create from date clicks"],
                ["All Events", "/events/list", "Searchable, filterable table of all events with type badges and registration counts"],
                ["Create Event", "/events/new", "Full-page form — title, type, dates, location, capacity, ticketing (free/paid), description"],
                ["Event Detail", "/events/[eventId]", "Event stats (registered/attended/no-shows/walk-ins), registrations tab, attendance tab"],
                ["Edit Event", "/events/[eventId]/edit", "Edit form pre-filled with existing event data"],
                ["Ticket Tiers", "/events/[eventId]/tiers", "Manage ticket tiers for paid events (name, price, capacity, description)"],
                ["Event Check-In", "/events/check-in", "Bulk member check-in from roster or walk-in registration for a selected event"],
                ["Tickets (Management)", "/events/management", "Global ticket management — create ticket types, assign tickets to members or visitors, download PDF tickets"],
                ["Registrations", "/events/registrations", "View all registrations across events with stats and search"],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionTable
              rows={[
                [
                  "Create Event",
                  "Opens dialog (on calendar) or navigates to full-page form to create a new event",
                  "events:create",
                ],
                [
                  "Edit Event",
                  "Opens edit form pre-filled with event data",
                  "events:update",
                ],
                [
                  "Delete Event",
                  "Permanently deletes the event (confirmation required)",
                  "events:delete",
                ],
                [
                  "Add Tier",
                  "Creates a new ticket tier for a paid event (name, price, capacity)",
                  "events:create",
                ],
                [
                  "Edit Tier",
                  "Opens edit dialog for a ticket tier",
                  "events:update",
                ],
                [
                  "Delete Tier",
                  "Deletes a ticket tier (blocked if registrations reference it)",
                  "events:delete",
                ],
                [
                  "Assign Ticket",
                  "Assigns a ticket to a member or visitor — choose event, tier, then search for attendee",
                  "events:create",
                ],
                [
                  "+ Register New Visitor",
                  "Creates a new visitor and assigns the ticket in one step (inside Assign Ticket dialog)",
                  "visitors:create",
                ],
                [
                  "Download Ticket PDF",
                  "Generates and downloads a PDF ticket with QR code, event details, and attendee name",
                  "events:read",
                ],
                [
                  "Bulk Check-In",
                  "Select members from roster, check in all selected at once for a chosen event",
                  "events:create",
                ],
                [
                  "Walk-In Check-In",
                  "Register a walk-in attendee and record their check-in for a chosen event",
                  "events:create",
                ],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filters &amp; Sort</CardTitle>
          </CardHeader>
          <CardContent>
            <FilterTable
              rows={[
                ["Search", "Server-side search by event title"],
                ["Type", "service / conference / lifecycle / training / social"],
                ["Sort by", "Start Date, Title, Type (+ asc/desc toggle)"],
                ["Event Filter (Registrations)", "Dropdown to select a specific event"],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Admin — Users ────────────────────────────── */}
      <Section id="admin-users" title="Admin — Users">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts, assign roles, and control access. Each user has
              one or more roles that determine their permissions across the system.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <PageTable
              rows={[
                ["Users List", "/admin/users", "View, search, filter, and manage all user accounts"],
                ["User Detail", "/admin/users/[profileId]", "View user account info, manage roles/permissions, and security settings"],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionTable
              rows={[
                [
                  "Invite User",
                  "Opens dialog to invite a new user by email with role assignment",
                  "users:create",
                ],
                [
                  "Edit Role",
                  "Opens role picker to change the user's assigned role(s)",
                  "users:update",
                ],
                [
                  "Reset Password",
                  "Sends a password reset email to the user",
                  "users:update",
                ],
                [
                  "Force Sign Out",
                  "Immediately signs the user out of all sessions",
                  "users:update",
                ],
                [
                  "Deactivate",
                  "Soft-deactivates the user account",
                  "users:delete",
                ],
                [
                  "Reactivate",
                  "Reactivates a previously deactivated user",
                  "users:delete",
                ],
                [
                  "Deactivate Selected",
                  "Batch deactivates all selected users (sequential with progress)",
                  "users:delete",
                ],
                [
                  "Export",
                  "Downloads user data as CSV/PDF/XLSX",
                  "users:read",
                ],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Admin — Roles ────────────────────────────── */}
      <Section id="admin-roles" title="Admin — Roles & Permissions">
        <Card>
          <CardHeader>
            <CardTitle>Roles &amp; Permissions</CardTitle>
            <CardDescription>
              View and customize role-based access control. Each role has a set of
              permissions that determine what actions its holders can perform.
              Church admins can create custom roles and add extra permissions to
              existing template roles.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <PageTable
              rows={[
                ["Roles Overview", "/admin/roles", "List all roles with permission counts, status badges, and customization info"],
                ["Permission Matrix", "/admin/roles/[roleName]", "Interactive resource × action checkbox grid to grant or revoke permissions for a role"],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionTable
              rows={[
                [
                  "Add Role",
                  "Opens dialog to create a new custom role (label + description). On success, navigates to the permission matrix editor",
                  "church_admin / super_admin",
                ],
                [
                  "Edit Permissions",
                  "Tick/untick permission checkboxes in the matrix grid. Changes save as additive overrides for template roles, or absolute replace for church-owned roles",
                  "church_admin / super_admin",
                ],
                [
                  "Reset to Defaults",
                  "Deletes all church-specific permission overrides for a template role, restoring global defaults",
                  "church_admin / super_admin",
                ],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Status Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <span className="mr-1">Locked</span>
                </Badge>
                <span className="text-sm text-muted-foreground">super_admin — cannot be modified</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Custom
                </Badge>
                <span className="text-sm text-muted-foreground">Church-owned role with its own permissions</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Customized
                </Badge>
                <span className="text-sm text-muted-foreground">Template role with church-specific overrides</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Default</Badge>
                <span className="text-sm text-muted-foreground">Unmodified template role</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ─── Admin — Settings ─────────────────────────── */}
      <Section id="admin-settings" title="Admin — Church Settings">
        <Card>
          <CardHeader>
            <CardTitle>Church Settings</CardTitle>
            <CardDescription>
              Configure your church&apos;s profile, branding, email, and security
              preferences. Only users with the{" "}
              <PermBadge perm="church_settings:update" /> permission can make changes.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <PageTable
              rows={[
                ["General Settings", "/admin/settings", "Church branding (logo), information (name, phone, website, address), email, and preferences (timezone, currency)"],
                ["Security", "/admin/settings", "Password change, two-factor authentication status, and email verification"],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionTable
              rows={[
                [
                  "Upload Logo",
                  "Upload or replace the church logo (image/*, ≤5MB). Displayed across the app",
                  "church_settings:update",
                ],
                [
                  "Edit Church Info",
                  "Edit phone, website, address, city, state, country. Name and denomination are fixed at registration",
                  "church_settings:update",
                ],
                [
                  "Change Email",
                  "Updates the church contact email (also updates sign-in credential)",
                  "church_settings:update",
                ],
                [
                  "Save Preferences",
                  "Save timezone and currency settings",
                  "church_settings:update",
                ],
                [
                  "Change Password",
                  "Change your personal account password",
                  "self-service",
                ],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Admin — Branches ─────────────────────────── */}
      <Section id="admin-branches" title="Admin — Branches">
        <Card>
          <CardHeader>
            <CardTitle>Branches</CardTitle>
            <CardDescription>
              Manage church locations and branches. Each branch can have its own
              members, and one branch is designated as the headquarters.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <PageTable
              rows={[
                ["Branches List", "/admin/branches", "View, search, filter, and manage all branches"],
                ["Branch Detail", "/admin/branches/[branchId]", "View branch info, contact details, location, and member count"],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionTable
              rows={[
                [
                  "Add Branch",
                  "Opens dialog to create a new branch (name, email, phone, address, city, state, country, headquarters toggle)",
                  "branches:create",
                ],
                [
                  "Edit",
                  "Opens edit dialog pre-filled with branch data",
                  "branches:update",
                ],
                [
                  "Delete",
                  "Permanently deletes the branch (blocked if members are assigned)",
                  "branches:delete",
                ],
                [
                  "Delete Selected",
                  "Batch deletes all selected branches (sequential with progress)",
                  "branches:delete",
                ],
                [
                  "Export",
                  "Downloads branch data as CSV/PDF/XLSX",
                  "branches:read",
                ],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Permissions Matrix ────────────────────────── */}
      <Section id="permissions-matrix" title="Permissions Matrix">
        <Card>
          <CardHeader>
            <CardTitle>Full Permissions Reference</CardTitle>
            <CardDescription>
              Every permission across all built modules. The matrix shows which
              actions (create, read, update, delete) are available for each
              resource. Your actual access depends on your assigned role(s).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Resource</th>
                    <th className="pb-2 px-3 font-medium text-center">Create</th>
                    <th className="pb-2 px-3 font-medium text-center">Read</th>
                    <th className="pb-2 px-3 font-medium text-center">Update</th>
                    <th className="pb-2 px-3 font-medium text-center">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { resource: "Members", prefix: "members" },
                    { resource: "Families", prefix: "families" },
                    { resource: "Visitors", prefix: "visitors" },
                    { resource: "Attendance", prefix: "attendance" },
                    { resource: "Giving", prefix: "giving" },
                    { resource: "Events", prefix: "events" },
                    { resource: "Users", prefix: "users" },
                    { resource: "Branches", prefix: "branches" },
                    { resource: "Church Settings", prefix: "church_settings" },
                    { resource: "Roles", prefix: "roles" },
                    { resource: "Analytics", prefix: "analytics" },
                    { resource: "Reports", prefix: "reports" },
                  ].map((r) => (
                    <tr key={r.prefix} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 font-medium">{r.resource}</td>
                      {["create", "read", "update", "delete"].map((action) => (
                        <td key={action} className="py-2.5 px-3 text-center">
                          <PermBadge perm={`${r.prefix}:${action}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
