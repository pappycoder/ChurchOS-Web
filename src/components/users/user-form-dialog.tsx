"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useInviteUser, useUpdateUserRole, VALID_ROLES } from "@/hooks/use-users";
import type { UserProfile } from "@/hooks/use-users";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  branchId: z.string().optional(),
});

const updateRoleSchema = z.object({
  role: z.string().min(1, "Role is required"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;
type UpdateRoleFormValues = z.infer<typeof updateRoleSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "invite" | "edit-role";
  user?: UserProfile;
}

export function UserFormDialog({
  open,
  onOpenChange,
  mode,
  user,
}: UserFormDialogProps) {
  const inviteMutation = useInviteUser();
  const updateRoleMutation = useUpdateUserRole();

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "member",
      branchId: "",
    },
  });

  const updateRoleForm = useForm<UpdateRoleFormValues>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      role: user?.role?.[0] || "member",
    },
  });

  React.useEffect(() => {
    if (mode === "edit-role" && user) {
      updateRoleForm.reset({ role: user.role?.[0] || "member" });
    }
  }, [mode, user, updateRoleForm]);

  React.useEffect(() => {
    if (!open) {
      inviteForm.reset();
      updateRoleForm.reset({ role: user?.role?.[0] || "member" });
    }
  }, [open, inviteForm, updateRoleForm, user]);

  const handleInviteSubmit = (values: InviteFormValues) => {
    inviteMutation.mutate(values, {
      onSuccess: () => {
        toast.success("User invited successfully");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Failed to invite user", {
          description: error?.message || "Please try again.",
        });
      },
    });
  };

  const handleUpdateRoleSubmit = (values: UpdateRoleFormValues) => {
    if (!user) return;
    updateRoleMutation.mutate(
      { profileId: user.profileId, role: values.role },
      {
        onSuccess: () => {
          toast.success("Role updated successfully");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error("Failed to update role", {
            description: error?.message || "Please try again.",
          });
        },
      }
    );
  };

  const isPending = inviteMutation.isPending || updateRoleMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "invite" ? "Invite User" : "Change Role"}
          </DialogTitle>
          <DialogDescription>
            {mode === "invite"
              ? "Send an invitation to a new user to join your church."
              : `Update the role for ${user?.firstName} ${user?.lastName}`}
          </DialogDescription>
        </DialogHeader>

        {mode === "invite" ? (
          <Form {...inviteForm}>
            <form
              onSubmit={inviteForm.handleSubmit(handleInviteSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={inviteForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={inviteForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={inviteForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VALID_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...updateRoleForm}>
            <form
              onSubmit={updateRoleForm.handleSubmit(handleUpdateRoleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={updateRoleForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VALID_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Updating..." : "Update Role"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
