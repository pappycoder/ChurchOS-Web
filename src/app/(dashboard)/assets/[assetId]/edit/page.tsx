"use client";
import { useParams, useRouter } from "next/navigation";
import { AssetFormDialog } from "@/components/assets/asset-form-dialog";
import { useAsset } from "@/hooks/use-assets";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";
export default function EditAssetPage() {
 const {assetId} = useParams<{assetId:string}>(); const router = useRouter(); const query = useAsset(assetId);
 return <div className="mx-auto max-w-4xl space-y-6"><PageHeader title="Edit asset" breadcrumbs={[{label:"Assets",href:"/assets"},{label:"Edit"}]} />{query.error ? <ErrorState title="Unable to load asset" /> : !query.data ? <p role="status">Loading asset…</p> : <AssetFormDialog presentation="page" open asset={query.data} onOpenChange={() => { if(confirmDiscardChanges()) router.push(`/assets/${assetId}`); }} onSaved={() => router.push(`/assets/${assetId}`)} />}</div>;
}
