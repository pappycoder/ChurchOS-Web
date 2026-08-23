"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Camera,
  Church,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useCurrentProfile,
  useUpdateCurrentProfile,
  useUploadAvatar,
  type CurrentProfile,
} from "@/hooks/use-profile";
import { useRoleLabelMap, resolveRoleLabel } from "@/hooks/use-roles";
import { ChangePasswordDialog } from "@/components/settings/change-password-dialog";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase() || "?";
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right break-words">{value}</span>
    </div>
  );
}

// ─── Identity card ─────────────────────────────────────────

function IdentityCard({ profile }: { profile: CurrentProfile }) {
  const labels = useRoleLabelMap();
  const roles = profile.role?.length ? profile.role : ["member"];
  const isActive = profile.status === "active";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatarUrl} alt={`${profile.firstName} ${profile.lastName}`} />
            <AvatarFallback className="text-2xl">
              {getInitials(profile.firstName, profile.lastName)}
            </AvatarFallback>
          </Avatar>
          <h2 className="mt-3 text-lg font-semibold">
            {profile.firstName} {profile.lastName}
          </h2>
          <div className="flex flex-wrap justify-center gap-1.5 mt-2">
            <Badge variant={isActive ? "default" : "destructive"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
            {profile.mfaEnabled && <Badge variant="secondary">MFA Enabled</Badge>}
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {roles.map((role) => (
              <Badge key={role} variant={role === "super_admin" ? "destructive" : "secondary"}>
                {resolveRoleLabel(role, labels)}
              </Badge>
            ))}
          </div>
        </div>
        <Separator className="my-4" />
        <div className="space-y-3">
          {profile.email && (
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{profile.email}</p>
              </div>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{profile.phone}</p>
              </div>
            </div>
          )}
          {profile.branch && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Branch</p>
                <p className="text-sm font-medium">
                  {profile.branch.name}
                  {profile.branch.isHeadquarters ? " (HQ)" : ""}
                </p>
              </div>
            </div>
          )}
          {profile.church && (
            <div className="flex items-start gap-3">
              <Church className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Church</p>
                <p className="text-sm font-medium">{profile.church.name}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Joined</p>
              <p className="text-sm font-medium">
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Basic information (view ↔ edit) ───────────────────────

const basicInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

function BasicInfoCard({ profile }: { profile: CurrentProfile }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const updateMutation = useUpdateCurrentProfile();

  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone ?? "",
    },
  });

  React.useEffect(() => {
    if (!isEditing) {
      form.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone ?? "",
      });
    }
  }, [isEditing, profile, form]);

  // Only include fields the user actually changed — mirrors PATCH semantics.
  const handleSave = (values: BasicInfoFormValues) => {
    const payload: Record<string, string> = {};
    if (values.firstName !== profile.firstName) payload.firstName = values.firstName;
    if (values.lastName !== profile.lastName) payload.lastName = values.lastName;
    if ((values.phone ?? "") !== (profile.phone ?? "")) payload.phone = values.phone ?? "";

    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }

    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Profile updated.");
        setIsEditing(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
        <div>
          <CardTitle>Basic Information</CardTitle>
          {!isEditing && (
            <CardDescription>Your personal details as they appear across the app.</CardDescription>
          )}
        </div>
        {!isEditing && (
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
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input value={profile.email ?? ""} disabled />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Managed by your church admin in Settings.
                  </p>
                </FormItem>
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
                <Button type="submit" disabled={updateMutation.isPending || !form.formState.isDirty}>
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
            <DataRow label="First Name" value={profile.firstName} />
            <DataRow label="Last Name" value={profile.lastName} />
            <DataRow label="Email" value={profile.email || "-"} />
            <DataRow label="Phone" value={profile.phone || "-"} />
            <DataRow
              label="Branch"
              value={
                profile.branch
                  ? `${profile.branch.name}${profile.branch.isHeadquarters ? " (HQ)" : ""}`
                  : "-"
              }
            />
            <DataRow label="Church" value={profile.church?.name ?? "-"} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Profile photo ─────────────────────────────────────────

function PhotoCard({ profile }: { profile: CurrentProfile }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadAvatar();

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPEG, PNG, WebP).");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }
    uploadMutation.mutate(file, {
      onSuccess: () => toast.success("Profile photo updated."),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Profile Photo</CardTitle>
        <CardDescription>A square image works best. Automatically optimized to WebP.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Avatar className="h-16 w-16 border">
            <AvatarImage src={profile.avatarUrl} alt={`${profile.firstName} ${profile.lastName}`} />
            <AvatarFallback>{getInitials(profile.firstName, profile.lastName)}</AvatarFallback>
          </Avatar>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                {profile.avatarUrl ? "Replace Photo" : "Upload Photo"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityCard() {
  const { data: profile } = useCurrentProfile();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Security</CardTitle>
        <CardDescription>Manage your sign-in credentials and two-factor auth.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-start gap-3">
            {profile?.mfaEnabled ? (
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <ShieldOff className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">Two-factor authentication</p>
              <p className="text-sm text-muted-foreground">
                {profile?.mfaEnabled
                  ? "Enabled — an extra code is required at sign-in."
                  : "Not enabled. Ask an admin about enabling MFA for your account."}
              </p>
            </div>
          </div>
          <Badge variant={profile?.mfaEnabled ? "secondary" : "outline"}>
            {profile?.mfaEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <Separator className="my-3" />
        <div className="flex items-center justify-between gap-4 py-1">
          <div>
            <p className="text-sm font-medium">Password</p>
            <p className="text-sm text-muted-foreground">
              Choose a strong password you don&apos;t use anywhere else.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <KeyRound className="h-3.5 w-3.5 mr-1.5" />
            Change Password
          </Button>
        </div>
      </CardContent>

      <ChangePasswordDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Skeleton className="h-96 rounded-lg" />
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useCurrentProfile();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        breadcrumbs={[{ label: "Profile" }]}
      />

      {error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load your profile.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : isLoading || !profile ? (
        <ProfileSkeleton />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <IdentityCard profile={profile} />
          <div className="lg:col-span-2 space-y-6">
            <BasicInfoCard profile={profile} />
            <PhotoCard profile={profile} />
            <SecurityCard />
          </div>
        </div>
      )}
    </div>
  );
}
