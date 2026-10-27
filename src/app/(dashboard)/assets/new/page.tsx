"use client";
import { useRouter } from "next/navigation";
import { AssetFormDialog } from "@/components/assets/asset-form-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";
export default function NewAssetPage() {
 const router = useRouter();
 return <div className="mx-auto max-w-4xl space-y-6"><PageHeader title="Register asset" breadcrumbs={[{label:"Assets",href:"/assets"},{label:"Register"}]} /><AssetFormDialog presentation="page" open onOpenChange={() => { if(confirmDiscardChanges()) router.push("/assets"); }} onSaved={asset => router.push(`/assets/${asset.id}`)} /></div>;
}
