import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  getRoleLabel,
  type UserProfile,
} from "@/hooks/use-users";
import {
  Mail,
  Phone,
  Calendar,
  Shield,
  Church,
  MapPin,
} from "lucide-react";

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const variant = role === "super_admin" ? "destructive" : "secondary";
  return (
    <Badge variant={variant} className="text-xs">
      {getRoleLabel(role)}
    </Badge>
  );
}

interface UserDetailSidebarProps {
  user: UserProfile;
}

export function UserDetailSidebar({ user }: UserDetailSidebarProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <Avatar className="mx-auto h-20 w-20">
          <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
          <AvatarFallback className="text-xl">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
        </Avatar>
        <CardTitle className="mt-2">{user.firstName} {user.lastName}</CardTitle>
        <div className="flex justify-center gap-2 mt-1">
          <Badge variant={user.status === "active" ? "default" : "destructive"}>
            {user.status}
          </Badge>
          {user.mfaEnabled && (
            <Badge variant="secondary">MFA Enabled</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-start gap-3">
            <span className="text-muted-foreground mt-0.5">
              <Shield className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Roles</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(user.role?.length ? user.role : ["member"]).map((role) => (
                  <RoleBadge key={role} role={role} />
                ))}
              </div>
            </div>
          </div>
        </div>
        {user.email && (
          <InfoRow
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={user.email}
          />
        )}
        {user.phone && (
          <InfoRow
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={user.phone}
          />
        )}
        {user.branch && (
          <InfoRow
            icon={<MapPin className="h-4 w-4" />}
            label="Branch"
            value={`${user.branch.name}${user.branch.isHeadquarters ? " (HQ)" : ""}`}
          />
        )}
        {user.church && (
          <InfoRow
            icon={<Church className="h-4 w-4" />}
            label="Church"
            value={user.church.name}
          />
        )}
        <Separator />
        <InfoRow
          icon={<Calendar className="h-4 w-4" />}
          label="Joined"
          value={new Date(user.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        />
      </CardContent>
    </Card>
  );
}
