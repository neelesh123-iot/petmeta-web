import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(message.type()==='error'&&/WebGLProgram|Shader Error/i.test(message.text()))errors.push(message.text())});
await mkdir('test-results/animations',{recursive:true});
try{
 await page.goto('http://127.0.0.1:3000');
 await expect(page.locator('[data-testid=intro] img')).toHaveCount(0);
 await page.getByRole('button',{name:'Skip intro'}).click();await page.waitForURL('**/login');
 await page.goto('http://127.0.0.1:3000/register');
 await expect(page.getByTestId('reactive-cat')).toHaveAttribute('data-ready','true',{timeout:30000});
 await page.waitForTimeout(600);await page.screenshot({path:'test-results/animations/register-desktop.png',fullPage:true});
 await page.getByLabel('Full Name',{exact:true}).fill('Alex');await expect(page.getByTestId('reactive-cat')).toHaveAttribute('data-mood','curious');
 await page.getByLabel('Email Address',{exact:true}).fill('alex');await expect(page.getByTestId('reactive-cat')).toHaveAttribute('data-mood','reading');
 await page.getByLabel('Email Address',{exact:true}).fill('alex@example.com');await expect(page.getByTestId('reactive-cat')).toHaveAttribute('data-mood','happy');
 await page.getByLabel('Password',{exact:true}).fill('HappyPaws123');await expect(page.getByTestId('reactive-cat')).toHaveAttribute('data-mood','shy');await page.waitForTimeout(600);await page.screenshot({path:'test-results/animations/password-shy.png',fullPage:true});
 await page.getByRole('button',{name:'Show password',exact:true}).click();await expect(page.getByLabel('Password',{exact:true})).toHaveAttribute('type','text');await expect(page.getByTestId('reactive-cat')).toHaveAttribute('data-mood','shy');
 await page.getByLabel('Full Name',{exact:true}).fill('');await page.getByRole('button',{name:'Create Account',exact:true}).click();await expect(page.getByTestId('reactive-cat')).toHaveAttribute('data-mood','sad');
 await page.getByRole('button',{name:'Explore the demo',exact:true}).click();await expect(page.getByTestId('reactive-cat')).toHaveAttribute('data-mood','joyful');await page.waitForTimeout(450);await page.screenshot({path:'test-results/animations/success-wave.png',fullPage:true});
 await page.waitForURL('**/transition');await expect(page.getByTestId('running-transition')).toHaveAttribute('data-ready','true',{timeout:30000});await page.waitForTimeout(2300);await page.screenshot({path:'test-results/animations/running.png'});await page.waitForURL('**/home',{timeout:20000});
 await expect(page.locator('[data-testid=home-3d] canvas')).toBeVisible();await page.waitForTimeout(800);await page.screenshot({path:'test-results/animations/home-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Open pet assistant',exact:true}).click();const box=await page.getByRole('dialog').boundingBox();if(box.width<1270||box.height<890)throw Error('Chat is not full screen');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:3000/register');await expect(page.getByTestId('reactive-cat')).toHaveAttribute('data-ready','true');await page.waitForTimeout(500);await page.screenshot({path:'test-results/animations/register-mobile.png',fullPage:true});if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))throw Error('Mobile overflow');
 await page.waitForTimeout(8500);await expect(page.getByTestId('reactive-cat')).toHaveAttribute('data-mood','sleepy');
 await page.goto('http://127.0.0.1:3000/home');await page.waitForTimeout(1000);await page.screenshot({path:'test-results/animations/home-mobile.png',fullPage:true});
 console.log(JSON.stringify({errors,passed:['intro without logo','curious/reading/happy/shy/sad/joyful/sleepy reactions','password visibility preserves shy pose','full-screen running transition and auto navigation','3D home visible by default','full-screen chat and Escape','mobile layout']},null,2));
 if(errors.length)throw Error(errors.join('\n'));
}catch(error){await page.screenshot({path:'test-results/animations/failure.png',fullPage:true});console.error('CHECK FAILED',error.message);console.error('PAGE ERRORS',errors);process.exitCode=1}finally{await browser.close()}
