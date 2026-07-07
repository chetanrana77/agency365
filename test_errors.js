const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:8000/calendar.html');
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Evaluating click on delete event...');
  // We need an event first. Let's create one.
  await page.evaluate(() => {
    localStorage.setItem('agency365_events', JSON.stringify([{
      id: "123", title: "Test", start: "2026-05-16T10:00:00", end: "2026-05-16T10:30:00"
    }]));
  });
  await page.reload();
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const ev = document.querySelector('.fc-event');
    if(ev) ev.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const delBtn = document.getElementById('delete-event-btn');
    if(delBtn) delBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Testing CRM...');
  await page.goto('http://localhost:8000/crm.html');
  await page.evaluate(() => {
    localStorage.setItem('agency365_clients', JSON.stringify([{
      id: "999", name: "Lead Test", status: "Lead", amount: 5000
    }]));
  });
  await page.reload();
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const delBtn = document.querySelector('.delete-btn');
    if(delBtn) delBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await browser.close();
})();
