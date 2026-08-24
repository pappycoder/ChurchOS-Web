"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import { useConvertVisitor, type Visitor } from "@/hooks/use-visitors";
import { useBranchesList } from "@/hooks/use-branches";

const convertSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  branchId: z.string().optional(),
});

type ConvertFormValues = z.infer<typeof convertSchema>;

export function ConvertVisitorDialog({
  open,
  onOpenChange,
  visitor,
  onConverted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitor: Visitor;
  /** Called after a successful conversion with the new member's ID. */
  onConverted?: (memberId: string) => void;
}) {
  const router = useRouter();
  const convertMutation = useConvertVisitor(visitor.id);
  const branchesQuery = useBranchesList({ limit: 100 });
  const [pending, setPending] = React.useState(false);

  const form = useForm<ConvertFormValues>({
    resolver: zodResolver(convertSchema),
    defaultValues: {
      firstName: visitor.firstName,
      lastName: visitor.lastName ?? "",
      email: visitor.email ?? "",
      phone: visitor.phone ?? "",
      branchId: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        firstName: visitor.firstName,
        lastName: visitor.lastName ?? "",
        email: visitor.email ?? "",
        phone: visitor.phone ?? "",
        branchId: "",
      });
    }
  }, [open, visitor, form]);

  const onSubmit = async (values: ConvertFormValues) => {
    setPending(true);
    try {
      const result = await convertMutation.mutateAsync({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        branchId: values.branchId || undefined,
      });
      toast.success(`${values.firstName} is now a member`, {
        description: "Their gender and custom fields were carried over.",
      });
      onOpenChange(false);
      onConverted?.(result.memberId);
      router.push(`/members/${result.memberId}`);
    } catch (error) {
      toast.error("Failed to convert visitor", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Convert to Member</DialogTitle>
          <DialogDescription>
            Creates an active member record from this visitor. Gender, WhatsApp number
            and custom fields carry over automatically, and the visitor is marked
            converted.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
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
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="amina@example.com" {...field} />
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
                      <Input placeholder="+234 801 234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
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

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Converting..." : "Convert to Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
