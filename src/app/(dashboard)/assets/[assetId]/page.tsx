"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AssetDetailDrawer } from "@/components/assets/asset-detail-drawer";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { useAsset } from "@/hooks/use-assets";
export default function AssetPage() {
 const {assetId} = useParams<{assetId:string}>(); const {can} = usePermissions(); const query = useAsset(assetId);
 return <div className="space-y-6"><PageHeader title={query.data?.name ?? "Asset details"} breadcrumbs={[{label:"Assets",href:"/assets"},{label:"Details"}]} action={can("assets:list","update") && <Button asChild><Link href={`/assets/${assetId}/edit`}>Edit asset</Link></Button>} /><AssetDetailDrawer presentation="page" open assetId={assetId} onOpenChange={() => {}} /></div>;
}
