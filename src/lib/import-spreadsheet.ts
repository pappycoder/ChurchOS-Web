/** Parse off the UI thread; terminate the worker on timeout or completion. */
export async function parseMemberSpreadsheet(file: File): Promise<Record<string, string>[]> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Files must be 5 MB or smaller.");
  if (!/\.(csv|xlsx)$/i.test(file.name)) throw new Error("Use a CSV or XLSX file. Save older XLS workbooks as XLSX first.");
  const buffer = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./workers/spreadsheet.worker.ts", import.meta.url), { type: "module" });
    const finish = () => { clearTimeout(timer); worker.terminate(); };
    const timer = setTimeout(() => { finish(); reject(new Error("Parsing timed out. Split the spreadsheet into smaller files.")); }, 20000);
    worker.onerror = () => { finish(); reject(new Error("Could not read the spreadsheet.")); };
    worker.onmessage = (event: MessageEvent<{ records?: Record<string, string>[]; error?: string }>) => {
      finish();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.records ?? []);
    };
    worker.postMessage({ buffer, csv: /\.csv$/i.test(file.name) }, [buffer]);
  });
}
