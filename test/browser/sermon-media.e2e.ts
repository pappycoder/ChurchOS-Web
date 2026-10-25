import { test, expect, type BrowserContext } from "@playwright/test";

function recording() {
  const bytes = Buffer.alloc(44 + 160000);
  bytes.write("RIFF"); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(8000, 24); bytes.writeUInt32LE(16000, 28);
  bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36); bytes.writeUInt32LE(160000, 40);
  return bytes;
}

async function fixture(context: BrowserContext, editing = false) {
  const audio = {assetId:"audio-a",filename:"Sunday Message.wav",url:"http://localhost:3000/api/backend/media/files/audio-a",mimeType:"audio/wav",sizeBytes:160044,folder:"sermons",permissions:"members",createdAt:"2026-10-25T09:00:00Z"};
  const video = {...audio,assetId:"video-a",filename:"Sunday Message.mp4",url:"https://old-api.example/api/v1/media/files/video-a",mimeType:"video/mp4"};
  const assets = editing ? [] : [audio, video];
  const sermon = {sermonId:"sermon-a",churchId:"church-a",branchId:"branch-a",branchName:"Main Branch",title:"Sunday Message",tags:[],sermonDate:"2026-10-25T09:00:00Z",createdAt:"2026-10-25T09:00:00Z",updatedAt:"2026-10-25T09:00:00Z",audioUrl:editing?undefined:audio.url,videoUrl:editing?undefined:video.url};
  const writes: {path:string;body:Record<string,unknown>}[] = [];
  const uploads: string[] = [];
  let releaseUpload!: () => void;
  const uploadGate = new Promise<void>(resolve => { releaseUpload = resolve; });
  await context.addCookies([{name:"churchos_token",value:"recording-fixture",url:"http://127.0.0.1:3107"}]);
  await context.route("https://embed.tawk.to/**", route => route.fulfill({body:""}));
  await context.route("**/api/session", route => route.fulfill({json:{hasSession:true}}));
  await context.route("**/api/backend/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path.includes("/media/files/")) {
      const bytes = path.endsWith("audio-a") ? recording() : Buffer.from("unplayable-video");
      const range = request.headers().range;
      const start = Number(range?.match(/^bytes=(\d+)-/)?.[1] ?? 0);
      return route.fulfill({status:range?206:200,body:bytes.subarray(start),headers:{"Content-Type":path.endsWith("audio-a")?"audio/wav":"video/mp4","Accept-Ranges":"bytes",...(range?{"Content-Range":`bytes ${start}-${bytes.length-1}/${bytes.length}`}:{})}});
    }
    let data: unknown = [];
    if (path.endsWith("/profiles/me")) data = {profileId:"profile-a",userId:"user-a",churchId:"church-a",branchId:"branch-a",branch:{name:"Main Branch"},firstName:"Media",lastName:"Viewer",role:["media_team"],status:"active",isAdminHq:false,planFeatures:["media"],permissions:["sermons:list:read","media:library:read","media:folders:read",...(editing?["sermons:update"]:[])]};
    else if (path.endsWith("/sermons/sermon-a")) {
      if (request.method() === "PATCH") {
        const body = request.postDataJSON();
        writes.push({path,body}); Object.assign(sermon,body);
      }
      data = sermon;
    } else if (path.endsWith("/sermons")) data = {data:[sermon],total:1};
    else if (path.endsWith("/media/library/folders")) data = assets.length ? [{folder:"sermons",count:assets.length}] : [];
    else if (path.endsWith("/media/library")) data = {data:assets,total:assets.length};
    else if (path.endsWith("/media/upload")) {
      const body = request.postDataBuffer()?.toString("latin1") ?? "";
      uploads.push(body);
      await uploadGate;
      const asset = body.includes("Sunday Message.mp4") ? video : audio;
      assets.push(asset);
      data = {assetId:asset.assetId,url:asset.url,path:`sermons/church-a/${asset.assetId}`,size:asset.sizeBytes,contentType:asset.mimeType};
    } else if (path.endsWith("/unread-count")) data = {count:0};
    else if (path.endsWith("/notifications") || path.endsWith("/auth/sessions")) data = {data:[],total:0};
    else if (path.endsWith("/bookmark")) data = {bookmarked:false};
    return route.fulfill({json:{success:true,data}});
  });
  return {writes,uploads,releaseUpload};
}

test("sermon readers can play uploaded audio and open both recordings with their current session", async ({page,context}) => {
  await fixture(context);
  await page.goto("/sermons/sermon-a");
  await expect(page.getByRole("heading",{name:"Audio Recording",exact:true})).toBeVisible();
  const audio = page.locator("audio");
  await expect(audio).toHaveAttribute("controls", "");
  await expect(audio).toHaveAttribute("src", "/api/backend/media/files/audio-a");
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.duration)).toBe(10);
  await expect(page.getByRole("link",{name:"Open audio recording",exact:true})).toHaveAttribute("href","/api/backend/media/files/audio-a");
  await expect(page.locator("video")).toHaveAttribute("src","/api/backend/media/files/video-a");
  await expect(page.getByRole("link",{name:"Open video recording",exact:true})).toHaveAttribute("href","/api/backend/media/files/video-a");
  await expect(page.getByRole("button",{name:"Edit",exact:true})).toHaveCount(0);
});

test("media library readers can preview audio and video and open the original without edit access", async ({page,context}) => {
  await fixture(context);
  await page.goto("/media?folder=sermons");
  await page.getByRole("button",{name:"Play Audio",exact:true}).click();
  const dialog = page.getByRole("dialog");
  await expect.poll(() => dialog.locator("audio").evaluate((element:HTMLAudioElement)=>element.duration)).toBe(10);
  await expect(dialog.getByRole("link",{name:"Open Original",exact:true})).toHaveAttribute("href","/api/backend/media/files/audio-a");
  await dialog.getByRole("button",{name:"Close",exact:true}).first().click();
  await page.getByRole("button",{name:"Watch Video",exact:true}).click();
  await expect(dialog.locator("video")).toHaveAttribute("controls","");
  await expect(dialog.getByRole("link",{name:"Open Original",exact:true})).toHaveAttribute("href","/api/backend/media/files/video-a");
  await expect(dialog.getByText("This recording could not play here.",{exact:false})).toBeVisible();
});

test("sermon uploads persist both URLs, block early save and show the files in the media library", async ({page,context}) => {
  const state = await fixture(context,true);
  await page.goto("/media");
  await expect(page.getByRole("heading",{name:"No files found",exact:true})).toBeVisible();
  await page.goto("/sermons/sermon-a/edit");
  await page.locator('input[type="file"][accept="audio/*"]').setInputFiles({name:"Sunday Message.wav",mimeType:"audio/wav",buffer:recording()});
  await page.getByRole("button",{name:"Upload",exact:true}).click();
  await expect(page.getByRole("button",{name:"Save Changes",exact:true})).toBeDisabled();
  state.releaseUpload();
  await expect(page.getByText("Audio uploaded",{exact:true})).toBeVisible();
  await page.locator('input[type="file"][accept="video/*"]').setInputFiles({name:"Sunday Message.mp4",mimeType:"video/mp4",buffer:Buffer.from("video")});
  await page.getByRole("button",{name:"Upload",exact:true}).click();
  await expect(page.getByText("Video uploaded",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Save Changes",exact:true}).click();
  await expect(page).toHaveURL(/\/sermons\/sermon-a$/);
  await expect(page.locator("audio")).toHaveAttribute("src","/api/backend/media/files/audio-a");
  await expect(page.locator("video")).toHaveAttribute("src","/api/backend/media/files/video-a");
  expect(state.writes[0].body).toMatchObject({audioUrl:"http://localhost:3000/api/backend/media/files/audio-a",videoUrl:"https://old-api.example/api/v1/media/files/video-a"});
  expect(state.uploads).toHaveLength(2);
  for (const body of state.uploads) {
    expect(body).toContain('name="folder"\r\n\r\nsermons');
    expect(body).toContain('name="branchId"\r\n\r\nbranch-a');
  }
  await page.goto("/media?folder=sermons");
  await expect(page.getByText("Sunday Message.wav",{exact:true})).toBeVisible();
  await expect(page.getByText("Sunday Message.mp4",{exact:true})).toBeVisible();
});
