"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Loader2,
  Trash2,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useBranchesList } from "@/hooks/use-branches";
import { useCreateMember } from "@/hooks/use-members";
import { useFamiliesList } from "@/hooks/use-families";
import { FamilyCombobox } from "@/components/members/family-combobox";
import {
  CustomFieldsEditor,
  rowsToCustomFields,
} from "@/components/members/custom-fields-editor";

const MAX_PHOTO_MB = 5;

const newMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  branchId: z.string().optional(),
  notes: z.string().optional(),
  familyId: z.string().optional(),
  familyRelationship: z.string().optional(),
  isFamilyHead: z.boolean().optional(),
  customFields: z.array(z.object({ key: z.string(), value: z.string() })),
});

type NewMemberFormValues = z.infer<typeof newMemberSchema>;

const RELATIONSHIP_OPTIONS = [
  "spouse",
  "child",
  "parent",
  "sibling",
  "ward",
  "other",
];

const EMPTY_VALUES: NewMemberFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  whatsappNumber: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  city: "",
  state: "",
  branchId: "",
  notes: "",
  familyId: "",
  familyRelationship: "",
  isFamilyHead: false,
  customFields: [],
};

export default function AddMemberPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const branchesQuery = useBranchesList({ limit: 100 });
  const createMutation = useCreateMember();
  // Powers the FamilyCombobox search.
  useFamiliesList({ limit: 20 });

  const form = useForm<NewMemberFormValues>({
    resolver: zodResolver(newMemberSchema),
    defaultValues: EMPTY_VALUES,
  });

  const customFieldsArray = useFieldArray({ control: form.control, name: "customFields" });

  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string>("");
  const [familyName, setFamilyName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Clean up the staged object URL.
  React.useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhotoSelected = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      toast.error(`Image must be ${MAX_PHOTO_MB} MB or smaller`);
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview("");
  };

  const onSubmit = async (values: NewMemberFormValues) => {
    setSaving(true);
    try {
      // 1) Create the member record.
      const member = await createMutation.mutateAsync({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        whatsappNumber: values.whatsappNumber?.trim() || undefined,
        gender: values.gender || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        address: values.address?.trim() || undefined,
        city: values.city?.trim() || undefined,
        state: values.state?.trim() || undefined,
        branchId: values.branchId || undefined,
        notes: values.notes?.trim() || undefined,
        customFields: rowsToCustomFields(values.customFields),
      });

      // 2) Optional photo — failure must not lose the created member.
      if (photoFile) {
        try {
          const formData = new FormData();
          formData.append("file", photoFile);
          formData.append("folder", "members");
          const uploaded = await api.post<{ url: string }>(
            "/media/upload/image",
            formData
          );
          await api.patch(`/members/${member.memberId}`, {
            photoUrl: uploaded.url,
          });
        } catch {
          toast.warning("Member created, but the photo could not be saved.", {
            description: "You can add a photo later from their profile.",
          });
        }
      }

      // 3) Optional family link — same non-fatal policy.
      if (values.familyId) {
        try {
          await api.post(`/families/${values.familyId}/members`, {
            memberId: member.memberId,
            relationship:
              values.familyRelationship && values.familyRelationship.length > 0
                ? values.familyRelationship
                : "other",
            ...(values.isFamilyHead ? { isHead: true } : {}),
          });
          void queryClient.invalidateQueries({ queryKey: ["families-list"] });
          void queryClient.invalidateQueries({ queryKey: ["family"] });
        } catch {
          toast.warning("Member created, but linking to the family failed.", {
            description: `Add ${values.firstName} to the family from its page.`,
          });
        }
      }

      toast.success(`${member.firstName} ${member.lastName} added successfully`);
      router.push(`/members/${member.memberId}`);
    } catch (error) {
      toast.error("Failed to add member", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Add Member"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Members", href: "/members" },
          { label: "Add" },
        ]}
        action={
          <Button variant="outline" onClick={() => router.push("/members")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Profile photo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Profile Photo</CardTitle>
              <CardDescription>
                Optional. Images are optimized automatically ({MAX_PHOTO_MB} MB max).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-5">
              <Avatar className="h-20 w-20">
                {photoPreview && <AvatarImage src={photoPreview} alt="Photo preview" />}
                <AvatarFallback className="text-xl">
                  {photoPreview ? (
                    ""
                  ) : (
                    <Camera className="h-7 w-7 text-muted-foreground" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <label>
                    <span className="inline-flex items-center gap-2 h-9 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground cursor-pointer hover:bg-primary/90">
                      <ImagePlus className="h-4 w-4" />
                      {photoFile ? "Replace Photo" : "Upload Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={saving}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoSelected(file);
                          e.target.value = "";
                        }}
                      />
                    </span>
                  </label>
                  {photoFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={removePhoto}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Remove
                    </Button>
                  )}
                </div>
                {photoFile && (
                  <p className="text-xs text-muted-foreground">
                    {photoFile.name} · {(photoFile.size / 1024 / 1024).toFixed(1)} MB
                    — uploaded when you save.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personal information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Personal Information</CardTitle>
              <CardDescription>Basic identity and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Chioma" {...field} />
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
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Eze" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="chioma@example.com" {...field} />
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
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+234 803 456 7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Address & membership */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Address &amp; Membership</CardTitle>
              <CardDescription>Where they live and which branch they belong to.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Street address" {...field} />
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
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(branchesQuery.data?.data ?? []).map((branch) => (
                          <SelectItem key={branch.branchId} value={branch.branchId}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Family membership */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Family Membership</CardTitle>
              <CardDescription>
                Optional — link this person to an existing family group.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="familyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Family</FormLabel>
                    <FormControl>
                      <FamilyCombobox
                        value={field.value ?? ""}
                        onChange={(familyId, family) => {
                          field.onChange(familyId);
                          setFamilyName(family?.name ?? "");
                          if (!familyId) {
                            form.setValue("familyRelationship", "");
                            form.setValue("isFamilyHead", false);
                          }
                        }}
                        selectedName={familyName}
                        placeholder="Search families..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="familyRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship to Head</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!form.watch("familyId")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RELATIONSHIP_OPTIONS.map((rel) => (
                          <SelectItem key={rel} value={rel}>
                            {rel.charAt(0).toUpperCase() + rel.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isFamilyHead"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <FormLabel>Mark as head of family</FormLabel>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Only relevant if a family is selected above.
                        </p>
                      </div>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        disabled={!form.watch("familyId")}
                      />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Custom fields */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Custom Fields</CardTitle>
              <CardDescription>
                Track anything specific to your church — occupation, baptism date,
                ministry roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomFieldsEditor
                rows={customFieldsArray.fields}
                onChange={(rows) =>
                  form.setValue("customFields", rows, { shouldDirty: true })
                }
                disabled={saving}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Notes</CardTitle>
              <CardDescription>
                Admin-only context about this member.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. New convert — referred by Pastor Daniel"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/members")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Member...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Add Member
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
