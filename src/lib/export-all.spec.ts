import { describe, expect, it, vi } from "vitest";
import { fetchAllPages, MAX_EXPORT_ROWS } from "./export-all";
import { givingExportRows } from "./giving-export";
import type { GivingTransaction } from "@/hooks/use-giving";

describe("complete downloads", () => {
  it("loads every page when the endpoint returns 100 rows and the default request size is 200", async () => {
    const records = Array.from({length: 251}, (_, id) => ({id}));
    const page = vi.fn(async (p: number) => ({data: records.slice((p-1)*100,p*100),total:records.length}));
    expect(await fetchAllPages(page)).toEqual(records);
    expect(page).toHaveBeenCalledTimes(3);
  });
  it("continues until empty when no count is provided", async () => {
    const page = vi.fn(async (p:number) => ({data:p===1?[1,2]:p===2?[3]:[]}));
    expect(await fetchAllPages(page)).toEqual([1,2,3]);
  });
  it("refuses partial downloads on page failure, repeated pages or premature empty results", async () => {
    await expect(fetchAllPages(async p => {if(p===2) throw Error("network failed"); return {data:[1],total:3};})).rejects.toThrow("network failed");
    await expect(fetchAllPages(async () => ({data:[1],total:3}))).rejects.toThrow("repeated");
    await expect(fetchAllPages(async p => ({data:p===1?[1]:[],total:3}))).rejects.toThrow("could not be loaded");
  });
  it("requires narrower filters rather than silently truncating large exports", async () => {
    await expect(fetchAllPages(async () => ({data:[1],total:MAX_EXPORT_ROWS+1}))).rejects.toThrow("Narrow");
  });
  it("does not substitute stale rows when a filtered result is empty", async () => {
    expect(await fetchAllPages(async () => ({data:[],total:0}))).toEqual([]);
  });
});

describe("giving download fields", () => {
  it("preserves names, business dates, payment references and cell-group context", () => {
    const gift = {transactionId:"tx-a",givingDate:"2026-10-01",createdAt:"2026-10-23T12:00:00Z",branchName:"West",cellGroupId:"group",cellGroupName:"Hope Group",cellGroupMeetingDate:"2026-10-01",categoryName:"Offering",amount:1250.50,currency:"USD",type:"digital",paymentMethod:"card",paymentGateway:"flutterwave",paymentReference:"PAY-123",receiptNumber:"2026/OFF/001",status:"success",notes:"Meeting gift"} as GivingTransaction;
    expect(givingExportRows([gift])[0]).toMatchObject({name:"Hope Group",linkedTo:"Hope Group",date:"2026-10-01",recordedAt:gift.createdAt,branch:"West",currency:"USD",amount:1250.50,method:"card",paymentReference:"PAY-123",transactionId:"tx-a",meetingDate:"2026-10-01"});
  });
});
