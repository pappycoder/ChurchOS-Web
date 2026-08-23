"use client";

/**
 * @file Church settings page — branding (logo), church information and
 * preferences (timezone/currency). Mirrors the SmartHR settings grammar:
 * section cards with bordered headers and right-aligned saves.
 */

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Building2,
  Globe,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useChurch,
  useChurchConfig,
  useUpdateChurch,
  useUpdateChurchConfig,
  useUpdateChurchEmail,
  uploadChurchLogo,
  type ChurchProfile,
} from "@/hooks/use-church";
import { useAuth } from "@/hooks/use-auth";

const TIMEZONES = [
  { value: "Africa/Lagos", label: "(GMT+1) Lagos" },
  { value: "Africa/Accra", label: "(GMT+0) Accra" },
  { value: "Africa/Nairobi", label: "(GMT+3) Nairobi" },
  { value: "Africa/Johannesburg", label: "(GMT+2) Johannesburg" },
  { value: "Africa/Cairo", label: "(GMT+2) Cairo" },
  { value: "Europe/London", label: "(GMT+0) London" },
  { value: "Europe/Paris", label: "(GMT+1) Paris" },
  { value: "America/New_York", label: "(GMT-5) New York" },
  { value: "America/Chicago", label: "(GMT-6) Chicago" },
  { value: "America/Los_Angeles", label: "(GMT-8) Los Angeles" },
  { value: "Asia/Dubai", label: "(GMT+4) Dubai" },
  { value: "Asia/Kolkata", label: "(GMT+5:30) Kolkata" },
  { value: "UTC", label: "(UTC) Coordinated Universal Time" },
];

const CURRENCIES = [
  { value: "NGN", label: "NGN — Nigerian Naira (₦)" },
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "GHS", label: "GHS — Ghanaian Cedi (₵)" },
  { value: "ZAR", label: "ZAR — South African Rand (R)" },
  { value: "KES", label: "KES — Kenyan Shilling (KSh)" },
  { value: "CAD", label: "CAD — Canadian Dollar (C$)" },
];

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

function useCanManageChurch(): boolean {
  const { user } = useAuth();
  const roles =
    user?.profile?.role === undefined
      ? []
      : Array.isArray(user.profile.role)
        ? user.profile.role
        : [user.profile.role];
  return roles.includes("church_admin") || roles.includes("super_admin");
}

// ─── Church information (view ↔ edit) ──────────────────────

const churchInfoSchema = z.object({
  name: z.string().min(1, "Church name is required"),
  denomination: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().min(1, "Country is required"),
});

type ChurchInfoFormValues = z.infer<typeof churchInfoSchema>;

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-3 py-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value || "-"}</p>
    </div>
  );
}

function churchInfoDefaults(church: ChurchProfile): ChurchInfoFormValues {
  return {
    name: church.name,
    denomination: church.denomination ?? "",
    phone: church.phone ?? "",
    website: church.website ?? "",
    address: church.address ?? "",
    city: church.city ?? "",
    state: church.state ?? "",
    country: church.country ?? "",
  };
}

function ChurchInfoCard({
  church,
  canManage,
}: {
  church: ChurchProfile;
  canManage: boolean;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const updateMutation = useUpdateChurch();

  const form = useForm<ChurchInfoFormValues>({
    resolver: zodResolver(churchInfoSchema),
    defaultValues: churchInfoDefaults(church),
  });

  React.useEffect(() => {
    if (!isEditing) {
      form.reset(churchInfoDefaults(church));
    }
  }, [isEditing, church, form]);

  const handleSave = (values: ChurchInfoFormValues) => {
    const payload: Record<string, string> = {};
    const current = churchInfoDefaults(church);
    for (const key of Object.keys(values) as (keyof ChurchInfoFormValues)[]) {
      if ((values[key] ?? "") !== (current[key] ?? "")) {
        payload[key] = values[key] ?? "";
      }
    }

    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }

    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Church information updated.");
        setIsEditing(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
        <div>
          <CardTitle>Church Information</CardTitle>
          {!isEditing && (
            <CardDescription>
              How your church appears across the platform.
            </CardDescription>
          )}
        </div>
        {canManage && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className={isEditing ? "pt-6" : "pt-4"}>
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Church Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="denomination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Denomination</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Pentecostal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+234 803 456 7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://church.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="12 Marina Road" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || !form.formState.isDirty}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div>
            <DataRow label="Church Name" value={church.name} />
            <DataRow label="Denomination" value={church.denomination} />
            <DataRow label="Email" value={church.email} />
            <DataRow label="Phone" value={church.phone} />
            <DataRow label="Website" value={church.website} />
            <DataRow
              label="Address"
              value={[church.address, church.city, church.state, church.country].filter(Boolean).join(", ")}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Branding (logo) ────────────────────────────────────────

function BrandingCard({
  church,
  canManage,
}: {
  church: ChurchProfile;
  canManage: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const updateMutation = useUpdateChurch();

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }

    try {
      const url = await uploadChurchLogo(file);
      updateMutation.mutate(
        { logoUrl: url },
        {
          onSuccess: () => toast.success("Church logo updated."),
          onError: (err: Error) => toast.error(err.message),
        },
      );
    } catch (err) {
      toast.error((err as Error).message || "Upload failed.");
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Branding</CardTitle>
        <CardDescription>Your logo appears in the sidebar and on communications.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-4">
          {church.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={church.logoUrl}
              alt={church.name}
              className="h-16 w-16 rounded-lg border border-border object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40">
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>
          )}
          <div className="space-y-1.5">
            {canManage && (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={updateMutation.isPending}
                  onClick={() => inputRef.current?.click()}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
                      {church.logoUrl ? "Replace Logo" : "Upload Logo"}
                    </>
                  )}
                </Button>
              </>
            )}
            <p className="text-xs text-muted-foreground">PNG or JPG, up to 5 MB.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Email (unified: sign-in + profile + church) ────────────

const churchEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ChurchEmailFormValues = z.infer<typeof churchEmailSchema>;

function EmailCard({
  church,
  canManage,
}: {
  church: ChurchProfile;
  canManage: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const updateMutation = useUpdateChurchEmail();

  const form = useForm<ChurchEmailFormValues>({
    resolver: zodResolver(churchEmailSchema),
    defaultValues: { email: church.email ?? "" },
  });

  React.useEffect(() => {
    if (!open) form.reset({ email: church.email ?? "" });
  }, [open, church, form]);

  const handleSubmit = (values: ChurchEmailFormValues) => {
    updateMutation.mutate(values.email, {
      onSuccess: () => {
        toast.success("Email updated. Use it to sign in from now on.");
        setOpen(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
        <div>
          <CardTitle>Email</CardTitle>
          <CardDescription>
            One email everywhere — your sign-in, your profile and the church contact.
          </CardDescription>
        </div>
        {canManage && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium break-all">
            {church.email || "No email set yet"}
          </p>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>
              This updates the sign-in credential, the admin profile and the
              church contact email together.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New email address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@church.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || !form.formState.isDirty}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Email"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Preferences ────────────────────────────────────────────

function PreferencesCard({ canManage }: { canManage: boolean }) {
  const configQuery = useChurchConfig();
  const updateMutation = useUpdateChurchConfig();

  const [timezone, setTimezone] = React.useState<string>("Africa/Lagos");
  const [currency, setCurrency] = React.useState<string>("NGN");
  const [initial, setInitial] = React.useState<{ timezone: string; currency: string } | null>(null);

  React.useEffect(() => {
    if (configQuery.data && initial === null) {
      const tz = String(configQuery.data.config.timezone ?? "Africa/Lagos");
      const cur = String(configQuery.data.config.currency ?? "NGN");
      setTimezone(tz);
      setCurrency(cur);
      setInitial({ timezone: tz, currency: cur });
    }
  }, [configQuery.data, initial]);

  const isDirty =
    initial !== null && (timezone !== initial.timezone || currency !== initial.currency);

  const handleSave = () => {
    updateMutation.mutate(
      { timezone, currency },
      {
        onSuccess: () => {
          setInitial({ timezone, currency });
          toast.success("Preferences saved.");
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Regional defaults used for dates and money.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {configQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Timezone
                </span>
              </Label>
              <Select
                value={timezone}
                onValueChange={setTimezone}
                disabled={!canManage || updateMutation.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select
                value={currency}
                onValueChange={setCurrency}
                disabled={!canManage || updateMutation.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        {canManage && (
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || updateMutation.isPending || configQuery.isLoading}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ───────────────────────────────────────────────────

export default function ChurchSettingsPage() {
  const churchQuery = useChurch();
  const canManage = useCanManageChurch();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" breadcrumbs={[{ label: "Settings" }]} />

      {churchQuery.isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : churchQuery.isError || !churchQuery.data ? (
        <Card>
          <CardContent className="pt-6 pb-6 flex flex-col items-center gap-3 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {(churchQuery.error as Error | null)?.message || "Failed to load church settings."}
            </p>
            <Button variant="outline" size="sm" onClick={() => churchQuery.refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{churchQuery.data.memberCount} members</Badge>
            <Badge variant="secondary">{churchQuery.data.branchCount} branches</Badge>
            {!canManage && (
              <span className="text-xs">(read-only — only admins can make changes)</span>
            )}
          </div>
          <BrandingCard church={churchQuery.data} canManage={canManage} />
          <EmailCard church={churchQuery.data} canManage={canManage} />
          <ChurchInfoCard church={churchQuery.data} canManage={canManage} />
          <PreferencesCard canManage={canManage} />
        </>
      )}
    </div>
  );
}
