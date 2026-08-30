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
              <strong>Main Menu</strong> — Members, Attendance, Giving, Events, Sermons, Media, Pastoral Care, Visitors
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
              The archive lifecycle reuses these actions:{" "}
              <strong>Archive</strong> and <strong>Delete Forever</strong> require
              the <em>delete</em> permission for that resource, while{" "}
              <strong>Restore</strong> requires the <em>update</em> permission.
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

        <Card>
          <CardHeader>
            <CardTitle>Archive Lifecycle</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Record-based modules support an <strong>archive</strong> lifecycle:{" "}
              <strong>archiving</strong> hides a record from the active lists while
              keeping its data, so it can be <strong>restored</strong> at any time or{" "}
              <strong>permanently deleted</strong> (<strong>Delete Forever</strong> —
              no undo).
            </p>
            <p>
              List pages show an <strong>Active | Archived</strong> filter at the start
              of the toolbar. The <strong>Archived</strong> view swaps each row&apos;s
              actions for <strong>Restore</strong> and <strong>Delete Forever</strong>;
              the active view&apos;s row menu gains an <strong>Archive</strong> item.
              Detail pages show an <strong>Archive</strong> button for active records
              (or <strong>Restore</strong> / <strong>Delete Forever</strong> for archived
              ones) plus an <strong>Archived</strong> badge.
            </p>
            <p>
              Gating: <strong>Archive</strong> and <strong>Delete Forever</strong> require
              the <strong>delete</strong> permission for that resource, while{" "}
              <strong>Restore</strong> requires the <strong>update</strong> permission.
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
                [
                  "Archive",
                  "Soft-archives the member — hidden from the active lists until restored",
                  "members:delete",
                ],
                [
                  "Restore",
                  "Brings an archived member back to the active lists",
                  "members:update",
                ],
                [
                  "Delete Forever",
                  "Permanently deletes an archived member",
                  "members:delete",
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
                ["Archived", "Active | Archived toggle — shows only archived members with Restore / Delete Forever"],
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
                [
                  "Archive",
                  "Soft-archives the family — hidden from the active lists until restored",
                  "families:delete",
                ],
                [
                  "Restore",
                  "Brings an archived family back to the active lists",
                  "families:update",
                ],
                [
                  "Delete Forever",
                  "Permanently deletes an archived family",
                  "families:delete",
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
                [
                  "Archive",
                  "Soft-archives the visitor — hidden from the active lists until restored",
                  "visitors:delete",
                ],
                [
                  "Restore",
                  "Brings an archived visitor back to the active lists",
                  "visitors:update",
                ],
                [
                  "Delete Forever",
                  "Permanently deletes an archived visitor",
                  "visitors:delete",
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
                { label: "Scheduled", color: "bg-amber-100 text-amber-800" },
                { label: "Interested", color: "bg-green-100 text-green-800" },
                { label: "Converted", color: "bg-emerald-100 text-emerald-800" },
                { label: "Dropped off", color: "bg-gray-100 text-gray-800" },
              ].map((s) => (
                <Badge key={s.label} variant="secondary" className={s.color}>
                  {s.label}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              On the follow-up board, Converted and Dropped off share a single terminal
              &ldquo;Converted / Dropped&rdquo; column; all six statuses stay available in each
              card&rsquo;s dropdown.
            </p>
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
                [
                  "Archive Service",
                  "Soft-archives a service — hidden from the active services list until restored",
                  "attendance:delete",
                ],
                [
                  "Restore",
                  "Brings an archived service back to the active services list",
                  "attendance:update",
                ],
                [
                  "Delete Forever",
                  "Permanently deletes an archived service",
                  "attendance:delete",
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
                ["Archived (Services)", "Active | Archived toggle on the Services list"],
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
                [
                  "Archive Category",
                  "Soft-archives a giving category — hidden from the active categories list until restored",
                  "giving:delete",
                ],
                [
                  "Restore",
                  "Brings an archived giving category back to the active categories list",
                  "giving:update",
                ],
                [
                  "Delete Forever",
                  "Permanently deletes an archived giving category",
                  "giving:delete",
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
                ["Archived (Categories)", "Active | Archived toggle on the Categories page"],
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
                [
                  "Archive",
                  "Soft-archives the event — hidden from the active events list until restored",
                  "events:delete",
                ],
                [
                  "Restore",
                  "Brings an archived event back to the active events list",
                  "events:update",
                ],
                [
                  "Delete Forever",
                  "Permanently deletes an archived event",
                  "events:delete",
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
                ["Archived", "Active | Archived toggle on the Events list"],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Sermons ─────────────────────────────────── */}
      <Section id="sermons" title="Sermons">
        <Card>
          <CardHeader>
            <CardTitle>Sermons Module</CardTitle>
            <CardDescription>
              Maintain a searchable archive of church sermons with audio and video
              playback, member bookmarking, and aggregated series and speaker lists.
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
                ["Sermon List", "/sermons", "Stats cards, debounced server search, sort controls, paginated table, CSV export, row actions (View/Edit/Delete)"],
                ["Add Sermon", "/sermons/new", "Full-page form — title, speaker, date, scripture; series & tags; media (audio/video upload or link); duration & description"],
                ["Sermon Detail", "/sermons/[sermonId]", "Inline audio player + video player (YouTube embed for YouTube links), bookmark toggle, info card, description"],
                ["Edit Sermon", "/sermons/[sermonId]/edit", "Edit form pre-filled with existing sermon data"],
                ["Series", "/sermons/series", "Aggregated series list — series name, sermon count, last preached date, \"View Sermons\" link"],
                ["Speakers", "/sermons/speakers", "Aggregated speaker list — speaker name, sermon count, last spoke date, \"View Sermons\" link"],
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
                  "Add Sermon",
                  "Navigates to the full-page create form to add a new sermon",
                  "sermons:create",
                ],
                [
                  "Edit Sermon",
                  "Opens the edit form pre-filled with sermon data (list row action or detail button)",
                  "sermons:update",
                ],
                [
                  "Delete Sermon",
                  "Permanently deletes the sermon (confirmation required)",
                  "sermons:delete",
                ],
                [
                  "Upload Audio / Video File",
                  "Uploads a file to the media library and saves its URL on the sermon (Upload File mode)",
                  "media:create",
                ],
                [
                  "Paste Media Link",
                  "Saves an external audio/video URL on the sermon without creating a media asset (Paste Link mode)",
                  "sermons:create",
                ],
                [
                  "Export CSV",
                  "Downloads the visible sermons as a CSV file",
                  "sermons:read",
                ],
                [
                  "Archive",
                  "Soft-archives the sermon — hidden from the active sermon list until restored",
                  "sermons:delete",
                ],
                [
                  "Restore",
                  "Brings an archived sermon back to the active sermon list",
                  "sermons:update",
                ],
                [
                  "Delete Forever",
                  "Permanently deletes an archived sermon",
                  "sermons:delete",
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
                ["Search", "Server-side search by title, speaker, or scripture"],
                ["Sort by", "Preached Date, Title, Date Added (+ asc/desc toggle)"],
                ["Speaker / Series", "Deep links from the Series and Speakers pages pre-filter the list by that speaker or series"],
                ["Archived", "Active | Archived toggle on the sermon list"],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Media ─────────────────────────────────────── */}
      <Section id="media" title="Media">
        <Card>
          <CardHeader>
            <CardTitle>Media Library Module</CardTitle>
            <CardDescription>
              Store and manage church files — images, audio, video, and documents —
              in folders with per-file access controls. Uploaded sermon audio/video,
              profile photos, and church logos live here.
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
                ["Library", "/media", "Card grid of files — folder/type/permission filters, debounced search, sort, pagination, image preview, row actions (Copy URL/Change Permissions/Delete)"],
                ["Upload", "/media/upload", "Drag-and-drop upload with folder selection — images optimized to WebP (≤5 MB), other files kept as-is (≤50 MB), per-file status + session history"],
                ["Folders", "/media/folders", "Folder overview — file count and newest file per folder, \"View files\" links pre-filter the library"],
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
                  "Upload File",
                  "Uploads a file into the library (Upload page or sermon media field)",
                  "media:create",
                ],
                [
                  "Copy URL",
                  "Copies the file's public URL to the clipboard for sharing or reuse",
                  "media:read",
                ],
                [
                  "Change Permissions",
                  "Switches the file between Public, Members, and Leadership visibility (also church-admin role)",
                  "media:update",
                ],
                [
                  "Delete File",
                  "Permanently deletes the file and its storage record (also church-admin role)",
                  "media:delete",
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
                ["Type", "All / Images / Audio / Video / Documents"],
                ["Folder", "All folders or a specific folder"],
                ["Permissions", "Public / Members / Leadership"],
                ["Search", "Server-side search by filename"],
                ["Sort by", "Date Added, Name, Size (+ asc/desc toggle)"],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Pastoral Care ─────────────────────────────── */}
      <Section id="pastoral" title="Pastoral Care">
        <Card>
          <CardHeader>
            <CardTitle>Pastoral Care Module</CardTitle>
            <CardDescription>
              Track pastoral follow-up for members — private notes with
              confidentiality levels, life events (birthdays, weddings, deaths...),
              and automated risk/engagement scoring to spot disengagement early.
              Note content is encrypted at rest and filtered by your
              confidentiality clearance.
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
                ["Notes", "/pastoral", "Paginated pastoral notes — confidentiality filter, tags, content preview, author & date. Add/Edit/Delete actions"],
                ["Life Events", "/pastoral/life-events", "Member milestones — type filter (birthday/wedding/death...), 'Upcoming only' toggle, notified/pending status"],
                ["Risk Scores", "/pastoral/risk-scores", "Disengagement risk by level (low/medium/high/critical) — member search, level filter, sort by score. Row click opens factor breakdown + suggested follow-ups"],
                ["Engagement", "/pastoral/engagement", "Member engagement distribution (highly/moderately/low/disengaged) with bucket filter and score-based table. Row click opens factor breakdown"],
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
                  "Add Note",
                  "Records a pastoral note about a member — member picker, confidentiality level, tags, content",
                  "pastoral:create",
                ],
                [
                  "Edit Note",
                  "Updates note content, confidentiality, and tags (row menu)",
                  "pastoral:update",
                ],
                [
                  "Delete Note / Life Event",
                  "Permanently deletes the record (confirmation required)",
                  "pastoral:delete",
                ],
                [
                  "Add Life Event",
                  "Records a member milestone — type, date, optional notes",
                  "pastoral:create",
                ],
                [
                  "Recalculate Scores",
                  "Recomputes risk and engagement scores for all members from recent activity",
                  "pastoral:update",
                ],
                [
                  "View Member Scoring",
                  "Opens a member's risk/engagement factors and suggested follow-ups (row click on Risk/Engagement pages)",
                  "pastoral:read",
                ],
                [
                  "Archive",
                  "Soft-archives a note or life event — hidden from the active lists until restored",
                  "pastoral:delete",
                ],
                [
                  "Restore",
                  "Brings an archived note or life event back to the active lists",
                  "pastoral:update",
                ],
                [
                  "Delete Forever",
                  "Permanently deletes an archived note or life event",
                  "pastoral:delete",
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
                ["Notes — Confidentiality", "Standard / Confidential / Restricted"],
                ["Life Events — Type", "birthday / wedding / death / dedication / baptism / anniversary / other"],
                ["Life Events — Upcoming only", "Shows future events sorted ascending by date"],
                ["Risk Scores — Level", "critical / high / medium / low"],
                ["Engagement — Bucket", "highly_engaged / moderately_engaged / low_engagement / disengaged"],
                ["Search", "Server-side search by member name (Risk Scores & Engagement)"],
                ["Sort by", "Risk/Engagement Score or Date Calculated (+ asc/desc toggle)"],
                ["Notes / Life Events — Archived", "Active | Archived toggle on the Notes and Life Events lists"],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Reports ──────────────────────────────────── */}
      <Section id="reports" title="Reports">
        <Card>
          <CardHeader>
            <CardTitle>Reports Module</CardTitle>
            <CardDescription>
              A single report generator that composes data blocks (financial,
              attendance, membership), applies a date range and optional branch,
              and exports the result as <strong>PDF</strong>, <strong>XLSX</strong> or{" "}
              <strong>CSV</strong>. Visualization lives in the separate Analytics
              module; Reports is focused on producing downloadable documents.
              All report data is generated client-side from the server-cached
              (5-10 min) report endpoints and requires{" "}
              <Badge>reports:read</Badge>.
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
                ["Generate Report", "/reports", "Compose Financial / Attendance / Members blocks with a date range (and branch for Financial & Attendance), pick PDF / XLSX / CSV, preview inline, and download"],
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
                  "Generate / Download Report",
                  "Builds the composed rows and downloads PDF / XLSX / CSV — client-side via jspdf / xlsx",
                  "reports:read",
                ],
                [
                  "Toggle data block",
                  "Select which summaries (Financial, Attendance, Members) to include in the export",
                  "reports:read",
                ],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filters &amp; Output</CardTitle>
          </CardHeader>
          <CardContent>
            <FilterTable
              rows={[
                ["Data blocks", "Financial summary · Attendance summary · Members summary — at least one required"],
                ["Date Range", "All time / This month / Last 30 days / This quarter / Year to date presets plus custom start/end dates"],
                ["Branch", "All branches or a specific branch — available when Financial or Attendance is selected (Members is church-wide)"],
                ["Format", "PDF (single combined document) · XLSX (one sheet per block) · CSV (one file per block)"],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Analytics ─────────────────────────────────── */}
      <Section id="analytics" title="Analytics">
        <Card>
          <CardHeader>
            <CardTitle>Analytics Module</CardTitle>
            <CardDescription>
              Cross-domain analytics dashboards giving pastors and administrators a
              unified view of the church — membership, attendance, and giving
              metrics with trend charts and breakdowns. Server-side results are
              cached for 3-10 minutes depending on endpoint. Access is role-based
              (the backend analytics endpoints are guarded by role only, no
              dedicated permission resource): the overview, attendance and members
              analytics are open to church admins, senior pastors and branch
              pastors; giving analytics additionally includes the treasurer.
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
                ["Overview", "/analytics", "Unified dashboard — total/active/new members, branches, attendance, giving, at-risk count, upcoming events, pending submissions and engagement distribution. Church admins, senior pastors & branch pastors"],
                ["Giving", "/analytics/giving", "Total / count / average gift, giving trend, by-category and top-donor breakdowns, by-type, by-status and a recurring-giving summary. Adds treasurers"],
                ["Attendance", "/analytics/attendance", "Total / member / visitor check-ins, first-time vs returning visitors, trend split by member/visitor, by-service and by-source / by-branch breakdowns. Church admins, senior pastors & branch pastors"],
                ["Members", "/analytics/members", "Total members, monthly growth trend, and by-status / by-gender / by-age-group distributions. Church admins, senior pastors & branch pastors"],
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
                  "View Overview / Attendance / Members analytics",
                  "Requires the branch-pastor role group — church_admin / senior_pastor / branch_pastor",
                  "Role-gated (no resource)",
                ],
                [
                  "View Giving analytics",
                  "Requires the treasurer role group — church_admin / senior_pastor / branch_pastor / treasurer",
                  "Role-gated (no resource)",
                ],
                [
                  "Refresh",
                  "Re-fetches the current page's analytics from the server",
                  "any analytics role",
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
                ["Date range", "All time / This month / Last 30 days / This quarter / Year to date presets plus custom start/end dates — Giving analytics only"],
                ["Branch", "All branches or a specific branch — Giving analytics only"],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Assets ─────────────────────────────────────── */}
      <Section id="assets" title="Assets">
        <Card>
          <CardHeader>
            <CardTitle>Assets Module</CardTitle>
            <CardDescription>
              Track church-owned physical assets — an asset register with
              categories, QR codes, condition/status tracking, maintenance
              scheduling, lending (loans), and depreciation schedules. Reads are
              available to any assets:read holder; registering, editing and moving
              assets through their lifecycle require the treasurer/branch-pastor
              role group; deleting assets and running the depreciation schedule is
              restricted to church admins and treasurers.
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
                ["Asset Register", "/assets", "Searchable, filterable register of all assets with stats (total / purchase value / current value), QR codes, depreciation, maintenance and loan records per asset"],
                ["Categories", "/assets/categories", "Manage asset categories (name + description)"],
                ["Maintenance", "/assets/maintenance", "Assets currently in maintenance; open any asset to schedule or record maintenance"],
                ["Loans", "/assets/loans", "Search the register and loan assets out / record returns from the loan drawer"],
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
                ["Register Asset", "Opens the create dialog to add an asset to the register", "assets:create"],
                ["Edit Asset", "Updates asset details inline via the edit dialog", "assets:update"],
                ["Delete Asset", "Permanently removes the asset (admin + treasurer only — other viewers see the toast error)", "assets:delete"],
                ["Add Category", "Creates a new asset category", "assets:create"],
                ["Edit Category", "Renames / re-describes a category", "assets:update"],
                ["Delete Category", "Permanently removes an unused category", "assets:delete"],
                ["Generate / Refresh QR", "Creates or refreshes the printable QR code for an asset", "assets:create"],
                ["Schedule Maintenance", "Creates a maintenance record (type, scheduled date, status, cost, who performed it)", "assets:create"],
                ["Loan Out", "Loans an asset to a member or named borrower with an expected return date", "assets:create"],
                ["Record Return", "Closes a loan with an actual return date and after-condition", "assets:update"],
                ["Export CSV", "Downloads the visible register rows", "assets:read"],
                ["View Details", "Opens the detail drawer (overview, QR, maintenance, loans, depreciation)", "assets:read"],
                ["Archive", "Soft-archives the asset or asset category — hidden from the active register/categories until restored", "assets:delete"],
                ["Restore", "Brings an archived asset or category back to the active lists", "assets:update"],
                ["Delete Forever", "Permanently deletes an archived asset or asset category", "assets:delete"],
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
                ["Search", "Debounced server search by name, asset tag or serial number (register)"],
                ["Status", "active / maintenance / retired / lost / disposed"],
                ["Condition", "new / good / fair / poor / damaged"],
                ["Category", "Any registered asset category"],
                ["Branch", "All branches or a specific branch"],
                ["Archived", "Active | Archived toggle on the register and Categories lists"],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Departments ─────────────────────────────── */}
      <Section id="departments" title="Departments">
        <Card>
          <CardHeader>
            <CardTitle>Departments &amp; Cell Groups</CardTitle>
            <CardDescription>
              Organize the church into ministry departments and small community cell
              groups. Departments hold member rosters with roles (member /
              leader / assistant leader); cell groups add an address, geolocation,
              a home branch,
              and per-meeting attendance — recorded for members or visitors, with
              walk-in visitors saved inline as real visitor records. Cell group reads
              are also available to department heads and cell leaders; attendance
              recording additionally includes secretaries.
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
                ["Departments", "/departments", "Searchable list of all departments with member counts; open any department to manage its members"],
                ["Cell Groups", "/departments/cell-groups", "Searchable list of all cell groups with branch, address, leader and meeting schedule"],
                ["Cell Group Detail", "/departments/cell-groups/[groupId]", "Header, stats, member roster, attendance records (with meeting-date filter), and nearby cell groups"],
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
                ["Add Department", "Creates a department (optional parent for hierarchy + description)", "departments:create"],
                ["Edit Department", "Updates name, parent or description", "departments:update"],
                ["Delete Department", "Removes the department record — assigned members are kept", "departments:delete"],
                ["Add Member", "Adds a member to a department roster with a role", "departments:update"],
                ["Remove Member", "Removes a member from a department roster", "departments:update"],
                ["Add Cell Group", "Creates a cell group with optional branch, leader, address, meeting day/time and coordinates", "cell_groups:create"],
                ["Edit Cell Group", "Updates the cell group details", "cell_groups:update"],
                ["Delete Cell Group", "Permanently removes the group, its members and attendance", "cell_groups:delete"],
                ["Add Group Member", "Adds a member to a cell group with a role (leader / assistant leader / member)", "cell_groups:create"],
                ["Remove Group Member", "Removes a member from a cell group", "cell_groups:update"],
                ["Record Attendance", "Checks in a member, an existing visitor, or a new walk-in visitor (created on the fly)", "cell_groups:create"],
                ["View Detail", "Opens the cell group detail page", "cell_groups:read"],
                ["Archive Department", "Soft-archives a department — hidden from the active lists until restored", "departments:delete"],
                ["Restore Department", "Brings an archived department back to the active lists", "departments:update"],
                ["Delete Forever (Department)", "Permanently deletes an archived department", "departments:delete"],
                ["Archive Cell Group", "Soft-archives a cell group — hidden from the active lists until restored", "cell_groups:delete"],
                ["Restore Cell Group", "Brings an archived cell group back to the active lists", "cell_groups:update"],
                ["Delete Forever (Cell Group)", "Permanently deletes an archived cell group", "cell_groups:delete"],
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
                ["Search", "Debounced local search by department name/description, or cell group name/leader/branch/address"],
                ["Meeting Date", "Attendance records can be narrowed to a single meeting date"],
                ["Archived", "Active | Archived toggle on the Departments and Cell Groups lists"],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Forms ─────────────────────────────────────── */}
      <Section id="forms" title="Forms">
        <Card>
          <CardHeader>
            <CardTitle>Forms</CardTitle>
            <CardDescription>
              Build dynamic forms to collect structured responses from members or the
              public. Compose fields (text, textarea, number, date, dropdown, checkbox,
              email, phone), publish a form, and share a public link to collect anonymous
              submissions. Submitted responses flow through a pending → approved /
              rejected workflow, and optional dedupe rules (a unique field and/or a hard
              submission cap) guard against duplicate public responses.
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
                ["Forms List", "/forms", "Searchable list of all forms with status, live response count, public-link and submission state; opens any form's detail"],
                ["New Form", "/forms/new", "Full-page builder — form details, fields, and settings (status, public sharing, dedupe rules)"],
                ["Form Detail", "/forms/[formId]", "Form overview, public share link (copy/regenerate), close/reopen, and its submissions list with approve/reject actions"],
                ["Edit Form", "/forms/[formId]/edit", "Pre-filled builder to update the form details, fields, and settings"],
                ["Take Form", "/forms/[formId]/fill", "Authenticated member fill page — the logged-in form holder submits for their own account (open to any forms:read holder when the form is published)"],
                ["Submissions", "/forms/submissions", "Monitor responses across forms — pick a form to review and approve/reject its submissions"],
                ["Public Page", "/forms/public/[publicToken]", "Anonymous, link-only submit page — no login required, outside the dashboard"],
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
                ["Add Form", "Builds a new form with fields and settings", "forms:create"],
                ["Edit Form", "Updates the form's details, fields or settings", "forms:update"],
                ["Clone Form", "Duplicates the form as a new draft you can rename", "forms:create"],
                ["Copy Link", "Copies the public submission link to the clipboard", "forms:update"],
                ["Regenerate Link", "Issues a fresh public token — the old link stops working", "forms:update"],
                ["Close Form", "Stops accepting new submissions (status becomes closed)", "forms:update"],
                ["Reopen Form", "Re-opens a closed form as a draft — edit and re-publish to collect again", "forms:update"],
                ["Approve / Reject Submission", "Advances a pending response to approved or rejected (with reason)", "forms:update"],
                ["Archive Form", "Soft-archives the form — hidden from the active list until restored", "forms:delete"],
                ["Restore Form", "Brings an archived form back to the active lists", "forms:update"],
                ["Delete Forever", "Permanently deletes the form and all of its submissions (no undo)", "forms:delete"],
                ["Submit", "Public or member responses — file attachments attach to the submission (uploads need the media:create permission)", "—"],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <FilterTable
              rows={[
                ["Search", "Debounced server search across form titles"],
                ["Status", "Submissions filtered by pending / approved / rejected on the detail and monitor pages"],
                ["Archived", "Active | Archived toggle on the Forms list"],
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ─── Communication ─────────────────────────────── */}
      <Section id="communication" title="Communication">
        <Card>
          <CardHeader>
            <CardTitle>Communication</CardTitle>
            <CardDescription>
              Reach your church through broadcast channels. Compose reusable message
              templates (WhatsApp, SMS, or email), send one-time broadcasts to a
              targeted audience (optionally on a schedule), and track message delivery
              for the WhatsApp channel.
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
                ["Templates", "/communication/templates", "List of reusable message templates with channel, category, language and variable definitions; filter, view, edit, publish, archive/restore, or delete"],
                ["Broadcasts", "/communication/broadcasts", "List of all broadcasts (draft, scheduled, sending, sent, failed, cancelled) with channel, status and audience stats; view detail or cancel a scheduled/sending broadcast"],
                ["New Broadcast", "/communication/broadcasts/new", "Full-page broadcast composer — name, channel, published-template picker, audience filters and optional schedule"],
                ["Messages", "/communication/messages", "Outbound/inbound WhatsApp message log with direction and phone filters, per-message detail, and a quick-send entry point"],
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
                ["Add Template", "Creates a new message template (name, channel, content, category, language, variables, status)", "templates:create"],
                ["Edit Template", "Updates an existing template's content, channel, category, language or variables", "templates:update"],
                ["Publish Template", "Publishes a draft template so it becomes selectable for broadcasts", "templates:update"],
                ["Archive Template", "Soft-archives a template — hidden from the active list until restored", "templates:delete"],
                ["Restore Template", "Brings an archived template back to the active lists", "templates:update"],
                ["Delete Forever", "Permanently deletes a template (no undo)", "templates:delete"],
                ["New Broadcast", "Creates a broadcast from a published template targeting an audience (member status, branch, gender) with optional scheduling", "broadcasts:create"],
                ["Cancel Broadcast", "Cancels a scheduled or currently-sending broadcast", "broadcasts:update"],
                ["Send Message", "Sends a one-off WhatsApp message (text) directly to a recipient", "whatsapp:create"],
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
                ["Search", "Debounced search across template names / broadcast names / message phones"],
                ["Channel", "Filter templates or broadcasts by WhatsApp / SMS / Email"],
                ["Status", "Filter templates by draft / published (and archived via the Active | Archived toggle); broadcasts by draft / scheduled / sending / sent / failed / cancelled"],
                ["Direction", "Messages filtered by outbound / inbound"],
                ["Archived", "Active | Archived toggle on the Templates list"],
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
                [
                  "Archive",
                  "Soft-archives the branch — hidden from the active list until restored",
                  "branches:delete",
                ],
                [
                  "Restore",
                  "Brings an archived branch back to the active list",
                  "branches:update",
                ],
                [
                  "Delete Forever",
                  "Permanently deletes an archived branch",
                  "branches:delete",
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
                    { resource: "Sermons", prefix: "sermons" },
                    { resource: "Media", prefix: "media" },
                    { resource: "Pastoral Care", prefix: "pastoral" },
                    { resource: "Users", prefix: "users" },
                    { resource: "Branches", prefix: "branches" },
                    { resource: "Church Settings", prefix: "church_settings" },
                    { resource: "Roles", prefix: "roles" },
                    { resource: "Analytics", prefix: "analytics" },
                    { resource: "Reports", prefix: "reports" },
                    { resource: "Assets", prefix: "assets" },
                    { resource: "Departments", prefix: "departments" },
                    { resource: "Cell Groups", prefix: "cell_groups" },
                    { resource: "Forms", prefix: "forms" },
                    { resource: "Templates", prefix: "templates" },
                    { resource: "Broadcasts", prefix: "broadcasts" },
                    { resource: "WhatsApp Messages", prefix: "whatsapp" },
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
