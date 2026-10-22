import { test, expect, type BrowserContext } from '@playwright/test';
async function fixture(context: BrowserContext, features: string[] | undefined, role = "branch_pastor") {
  await context.route('https://embed.tawk.to/**', route => route.fulfill({body:''}));
  await context.addCookies([{name:'churchos_token',value:'plan-fixture',url:'http://127.0.0.1:3107'}]);
  await context.addInitScript(({features,role}) => {
    const original=window.fetch.bind(window);
    const requests:string[]=[];
    (window as unknown as { planRequests:string[] }).planRequests=requests;
    window.fetch=async(input,options)=>{
      const path=new URL(input instanceof Request?input.url:String(input),location.origin).pathname;
      if(!path.startsWith('/api/'))return original(input,options);
      requests.push(path);
      if(path==='/api/session')return new Response(JSON.stringify({hasSession:true}));
      const profile={ profileId:'p',userId:'u',churchId:'c',role:[role],status:'active',firstName:'Plan',lastName:'Test',isAdminHq:true,planFeatures:features,
        permissions:[...(role==='church_admin'?['integrations:read','integrations:update','roles:read','roles:update','attendance:services:create','attendance:services:update','users:read','profiles:read','profiles:create']:[]),'members:all:read','members:read','families:read','attendance:dashboard:read','attendance:records:read','attendance:reports:read','attendance:services:read','visitors:list:read','giving:view','giving:dashboard:read','giving:categories:read','giving:records:read','events:create','events:tickets:create','events:calendar:read','events:list:read','events:registrations:read','events:tickets:read','events:checkin:read','departments:read','cell_groups:read','forms:view','forms:list:read','assets:list:read','pastoral:notes:read','appointments:read','sermons:list:read','media:library:read','templates:read','broadcasts:read','giving:reports:read','reports:view','reports:financial:read','reports:attendance:read','reports:members:read'] };
      const data=path.endsWith('/profiles/me')?profile:path.endsWith('/reports/financial')?{startDate:'2026-10-01',endDate:'2026-10-22',grandTotal:25000,transactionCount:2,averageAmount:12500,byCategory:[],monthlyTrend:[]}:path.endsWith('/church/roles')?{roles:['super_admin','senior_pastor','church_admin'].map(roleName=>({roleName,permissions:[],description:null,isCustomized:false}))}:path.endsWith('/church/roles/all')?[]:path.endsWith('/attendance/summary')?{totalCheckIns:42,memberCheckIns:30,visitorCheckIns:12,bySource:{},byCategory:{},byGender:{}}:path.endsWith('/attendance/trends')?[]:path.endsWith('/church/integrations')?{providers:[{id:'paystack',label:'Paystack',channels:['payment'],fields:[],help:'Connect your payment account.'},{id:'flutterwave',label:'Flutterwave',channels:['payment'],fields:[],help:'Connect your payment account.'}],accounts:[],channels:[{channel:'payment',mode:'disabled',account_id:null,settings:{},updated_at:''}]}:{data:[],meta:{page:1,limit:15,total:0,totalPages:1}};
      return new Response(JSON.stringify({success:true,data}),{headers:{'Content-Type':'application/json'}});
    };
  },{features,role});
}
test('Essentials blocks paid pages and hides their nested navigation without fetching module data',async({page,context})=>{
  await fixture(context,["giving"]);
  for(const path of ['/departments','/departments/cell-groups','/forms','/events/management','/pastoral','/assets','/sermons']){
    await page.goto(path);
    await expect(page.getByRole('heading',{name:'This feature is available on a different plan'})).toBeVisible();
    await expect(page.getByRole('button',{name:'View historical records'})).toHaveCount(0);
    const requests=await page.evaluate(()=>(window as unknown as {planRequests:string[]}).planRequests);
    expect(requests.some(path=>/^\/api\/v1\/(giving|forms|events|pastoral|assets|sermons|admin\/(departments|cell-groups))(\/|$)/.test(path))).toBe(false);
  }
});
test('Essentials can use giving categories and records while analytics stays locked',async({page,context})=>{
  await fixture(context,['giving']);
  await page.goto('/giving/categories');
  await expect(page.getByRole('heading',{name:'Categories',exact:true})).toBeVisible();
  await page.goto('/giving/records');
  await expect(page.getByRole('heading',{name:'Records',exact:true})).toBeVisible();
  await expect(page.getByText('Send to giver…')).toHaveCount(0);
  await page.goto('/analytics/giving');
  await expect(page.getByText('Available on Network and higher plans.')).toBeVisible();
});
test('Community includes giving and groups but blocks Network tickets and check-in',async({page,context})=>{
  await fixture(context,['giving','events','groups','forms','reports','email','media']);
  await page.goto('/giving/categories');
  await expect(page.getByRole('heading',{name:'Categories',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Tickets',exact:true})).toHaveCount(0);
  for(const path of ['/events/management','/events/check-in']){
    await page.goto(path);
    await expect(page.getByText('Available on Network and higher plans.')).toBeVisible();
  }
});
test('missing plan entitlements fail closed for paid modules',async({page,context})=>{
  await fixture(context,undefined);
  await page.goto('/forms');
  await expect(page.getByRole('heading',{name:'This feature is available on a different plan'})).toBeVisible();
});

test('Community creates free events while paid-event controls require Network',async({page,context})=>{
  await fixture(context,['giving','events','groups','forms','reports','email','media']);
  await page.goto('/events/new');
  await expect(page.getByRole('switch')).toBeDisabled();
  await expect(page.getByRole('switch')).toBeChecked();
  await expect(page.getByText('Paid events require Network or above and ticket management access.')).toBeVisible();
});

test('Essentials administrators can configure payments without email or messaging channels',async({page,context})=>{
  await fixture(context,['giving'],'church_admin');
  await page.goto('/admin/integrations');
  await expect(page.getByRole('heading',{name:'Payments',exact:true})).toBeVisible();
  await expect(page.getByLabel('Provider',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Email',exact:true})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'WhatsApp',exact:true})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'SMS',exact:true})).toHaveCount(0);
});

for (const role of ['church_admin', 'branch_pastor']) {
  test(`Essentials ${role} attendance dashboard loads without requesting paid modules`, async ({page,context}) => {
    await fixture(context, ['giving'], role);
    await page.goto('/attendance');
    await expect(page.getByRole('heading', {name:'Attendance',exact:true})).toBeVisible();
    await expect(page.getByText('42', {exact:true}).first()).toBeVisible();
    await expect(page.getByText('Event Attendance', {exact:true})).toHaveCount(0);
    await expect(page.getByRole('heading',{name:'This feature is available on a different plan'})).toHaveCount(0);
    const requests = await page.evaluate(() => (window as unknown as {planRequests:string[]}).planRequests);
    expect(requests.some(path => path.endsWith('/attendance/summary'))).toBe(true);
    expect(requests.some(path => /\/api\/v1\/(events|analytics|admin\/dashboard)(\/|$)/.test(path))).toBe(false);
  });
}

test('church roles and invitation options put Church Admin first and hide Super Admin', async ({page,context}) => {
  await fixture(context, ['giving'], 'church_admin');
  await page.goto('/admin/roles');
  await expect(page.getByRole('heading', {name:'Roles & Permissions',exact:true})).toBeVisible();
  await expect(page.getByRole('row').nth(1).getByRole('cell').first()).toHaveText('Church Admin');
  await expect(page.getByRole('cell', {name:'Super Admin',exact:true})).toHaveCount(0);
  await page.goto('/admin/users');
  await page.getByRole('button', {name:'Add User',exact:true}).click();
  await page.getByRole('dialog').getByRole('combobox').click();
  await expect(page.getByRole('option').first()).toHaveText('Church Admin');
  await expect(page.getByRole('option', {name:'Super Admin',exact:true})).toHaveCount(0);
  await expect(page.getByRole('option', {name:'Senior Pastor',exact:true})).toBeVisible();
});

test('Essentials can open giving reports and generate financial reports without other report blocks', async ({page,context}) => {
  await fixture(context, ['giving'], 'church_admin');
  await page.goto('/giving/reports');
  await expect(page.getByRole('heading', {name:'Reports',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'This feature is available on a different plan'})).toHaveCount(0);
  await page.goto('/reports');
  await expect(page.getByText('Financial summary', {exact:true}).first()).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(1);
  const requests = await page.evaluate(() => (window as unknown as {planRequests:string[]}).planRequests);
  expect(requests.some(path => path.endsWith('/reports/financial'))).toBe(true);
  expect(requests.some(path => /\/reports\/(attendance|members)$/.test(path))).toBe(false);
  await expect(page.getByRole('heading',{name:'This feature is available on a different plan'})).toHaveCount(0);
});

test('service creation and editing round-trip local clock times', async ({page,context}) => {
  await fixture(context, ['giving'], 'church_admin');
  await context.addInitScript(() => {
    const previous = window.fetch.bind(window);
    let saved: Record<string, unknown> | undefined;
    window.fetch = async (input, options) => {
      const path = new URL(input instanceof Request ? input.url : String(input), location.origin).pathname;
      if (!path.startsWith('/api/') || !/\/services(?:\/clock-service)?$/.test(path)) return previous(input, options);
      const method = options?.method ?? 'GET';
      if (method === 'POST' || method === 'PATCH') {
        saved = { serviceId:'clock-service',churchId:'c',name:'Sunday Service',category:'mixed',isActive:true,createdAt:'2026-10-22',updatedAt:'2026-10-22',...saved,...JSON.parse(String(options?.body ?? '{}')) };
      }
      const data = method === 'GET' ? { data:saved?[saved]:[],meta:{page:1,limit:15,total:saved?1:0,totalPages:1} } : saved;
      return new Response(JSON.stringify({success:true,data}), {headers:{'Content-Type':'application/json'}});
    };
  });
  await page.goto('/attendance/services');
  await page.getByRole('button',{name:'Add Service',exact:true}).click();
  await page.getByLabel('Name *',{exact:true}).fill('Sunday Service');
  await page.getByLabel('Start Time',{exact:true}).fill('09:00');
  await page.getByLabel('End Time',{exact:true}).fill('11:00');
  await page.getByRole('button',{name:'Create Service',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('cell',{name:'09:00–11:00',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'More actions',exact:true}).click();
  await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
  await expect(page.getByLabel('Start Time',{exact:true})).toHaveValue('09:00');
  await expect(page.getByLabel('End Time',{exact:true})).toHaveValue('11:00');
  await page.getByLabel('Start Time',{exact:true}).fill('23:30');
  await page.getByLabel('End Time',{exact:true}).fill('00:00');
  await page.getByRole('button',{name:'Save Changes',exact:true}).click();
  await expect(page.getByRole('cell',{name:'23:30–00:00',exact:true})).toBeVisible();
});
