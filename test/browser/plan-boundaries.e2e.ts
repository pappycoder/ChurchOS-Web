import { test, expect, type BrowserContext } from '@playwright/test';
async function fixture(context: BrowserContext, features: string[] | undefined) {
  await context.route('https://embed.tawk.to/**', route => route.fulfill({body:''}));
  await context.addCookies([{name:'churchos_token',value:'plan-fixture',url:'http://127.0.0.1:3107'}]);
  await context.addInitScript(({features}) => {
    const original=window.fetch.bind(window);
    const requests:string[]=[];
    (window as unknown as { planRequests:string[] }).planRequests=requests;
    window.fetch=async(input,options)=>{
      const path=new URL(input instanceof Request?input.url:String(input),location.origin).pathname;
      if(!path.startsWith('/api/'))return original(input,options);
      requests.push(path);
      if(path==='/api/session')return new Response(JSON.stringify({hasSession:true}));
      const profile={ profileId:'p',userId:'u',churchId:'c',role:['branch_pastor'],status:'active',firstName:'Plan',lastName:'Test',isAdminHq:true,planFeatures:features,
        permissions:['members:all:read','members:read','families:read','attendance:dashboard:read','attendance:services:read','visitors:list:read','giving:view','giving:dashboard:read','giving:categories:read','giving:records:read','events:calendar:read','events:list:read','events:registrations:read','events:tickets:read','events:checkin:read','departments:read','cell_groups:read','forms:view','forms:list:read','assets:list:read','pastoral:notes:read','appointments:read','sermons:list:read','media:library:read','templates:read','broadcasts:read','reports:view','reports:financial:read'] };
      const data=path.endsWith('/profiles/me')?profile:{data:[],meta:{page:1,limit:15,total:0,totalPages:1}};
      return new Response(JSON.stringify({success:true,data}),{headers:{'Content-Type':'application/json'}});
    };
  },{features});
}
test('Essentials blocks paid pages and hides their nested navigation without fetching module data',async({page,context})=>{
  await fixture(context,[]);
  for(const path of ['/giving/categories','/departments','/departments/cell-groups','/forms','/events/management','/pastoral','/assets','/sermons']){
    await page.goto(path);
    await expect(page.getByRole('heading',{name:'This feature is available on a different plan'})).toBeVisible();
    await expect(page.getByRole('button',{name:'View historical records'})).toHaveCount(0);
    const requests=await page.evaluate(()=>(window as unknown as {planRequests:string[]}).planRequests);
    expect(requests.some(path=>/^\/api\/v1\/(giving|forms|events|pastoral|assets|sermons|admin\/(departments|cell-groups))(\/|$)/.test(path))).toBe(false);
  }
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
