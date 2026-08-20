"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getRoleLabel, VALID_ROLES, type UserProfile } from "@/hooks/use-users";
import {
  User,
  Shield,
  KeyRound,
  Calendar,
  Clock,
} from "lucide-react";

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

interface UserDetailContentProps {
  user: UserProfile;
}

export function UserDetailContent({ user }: UserDetailContentProps) {
  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList>
        <TabsTrigger value="account">
          <User className="h-4 w-4 mr-1.5" />
          Account Info
        </TabsTrigger>
        <TabsTrigger value="role">
          <Shield className="h-4 w-4 mr-1.5" />
          Role & Permissions
        </TabsTrigger>
        <TabsTrigger value="security">
          <KeyRound className="h-4 w-4 mr-1.5" />
          Security
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DataRow label="Profile ID" value={user.profileId} />
            <DataRow label="User ID" value={user.userId} />
            <DataRow label="First Name" value={user.firstName} />
            <DataRow label="Last Name" value={user.lastName} />
            <DataRow label="Email" value={user.email || "Not set"} />
            <DataRow label="Phone" value={user.phone || "Not set"} />
            <DataRow label="Status" value={user.status.charAt(0).toUpperCase() + user.status.slice(1)} />
            <DataRow
              label="Created"
              value={new Date(user.createdAt).toLocaleString()}
            />
            <DataRow
              label="Last Updated"
              value={new Date(user.updatedAt).toLocaleString()}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="role" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role & Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Role</p>
              <Badge variant="secondary" className="text-sm">
                <Shield className="h-3.5 w-3.5 mr-1" />
                {getRoleLabel(user.role)}
              </Badge>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Available Roles</p>
              <div className="flex flex-wrap gap-2">
                {VALID_ROLES.map((role) => (
                  <Badge
                    key={role.value}
                    variant={role.value === user.role ? "default" : "outline"}
                    className="text-xs"
                  >
                    {role.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DataRow
              label="MFA Status"
              value={user.mfaEnabled ? "Enabled" : "Disabled"}
            />
            <DataRow label="Account Status" value={user.status === "active" ? "Active" : "Inactive"} />
            <DataRow
              label="Last Sign In"
              value="N/A"
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
