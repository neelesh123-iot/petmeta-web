import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const bookingDate=new Date();bookingDate.setDate(bookingDate.getDate()+1);const bookingDateString=bookingDate.toISOString().slice(0,10);
const page=await browser.newPage({viewport:{width:1440,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:3000/home',{waitUntil:'networkidle'});await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/home-desktop.png',fullPage:true});
await page.goto('http://127.0.0.1:3000/login',{waitUntil:'networkidle'});await page.screenshot({path:'test-results/login-desktop.png',fullPage:true});await page.getByRole('button',{name:'Explore the demo',exact:true}).click();await page.waitForURL('**/home',{timeout:30000});
await page.goto('http://127.0.0.1:3000/booking/vet-1');await page.locator('input[type=date]').fill(bookingDateString);await page.getByRole('button',{name:'10:30',exact:true}).click();await page.locator('.booking-form select').selectOption('Mochi');await page.getByRole('button',{name:'Confirm demo appointment'}).click();await page.getByText('DEMO BOOKING SAVED',{exact:true}).waitFor();await page.getByRole('link',{name:'View appointments'}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByText('Cancelled',{exact:true}).waitFor();
await page.goto('http://127.0.0.1:3000/chat');await page.getByRole('button',{name:'Help me plan a puppy routine'}).click();await page.getByRole('alert').waitFor();
await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:3000/home',{waitUntil:'networkidle'});await page.screenshot({path:'test-results/home-mobile.png',fullPage:true});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);if(overflow)errors.push('Mobile horizontal overflow');await page.goto('http://127.0.0.1:3000/register',{waitUntil:'networkidle'});await page.screenshot({path:'test-results/register-mobile.png',fullPage:true});
console.log(JSON.stringify({errors,passed:['desktop and mobile render','demo onboarding','booking save and cancellation','missing AI connection state']},null,2));await browser.close();if(errors.length)process.exit(1);


