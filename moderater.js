let fs = require("fs");
require("chromedriver");
let swd = require("selenium-webdriver");
let bldr = new swd.Builder();
let driver = bldr.forBrowser("chrome").build();

let cFile = process.argv[2];
(async function () {
  try {
    // ******************************************Login****************************
    await loginHelper();
    // ************************dashboard**********************************
    let DropDownBtn = await driver.findElement(swd.By.css("a[data-analytics=NavBarProfileDropDown]"))
    await DropDownBtn.click();
    let adminLinkanchor = await driver.findElement(swd.By.css("a[data-analytics=NavBarProfileDropDownAdministration]"));
    await adminLinkanchor.click();
    // ***************************************Manage challenges******************************************
    await waitForLoader();
    let manageTabs = await driver.findElements(swd.By.css(".administration header ul li"));
    await manageTabs[1].click();

    let ManageChallengePage = await driver.getCurrentUrl();
    await driver.get(ManageChallengePage);
    await waitForLoader();
    let qidx = 0;
    let questionElement = await GetMeQuestion(qidx);
    while (true) {
      //  => qnumber => question
      if (questionElement == null) {
        console.log("All Question processed");
        return;
      }
      questionElement = await GetMeQuestion(qidx);
      await Moderator(questionElement,process.argv[3]);
      await driver.get(ManageChallengePage);
      await waitForLoader();
      qidx++;
    }
  
  } catch (err) {
    console.log(err);
  }
})()

async function GetMeQuestion(qidx){  
  let pidx = Math.floor(qidx / 10);
  let pQidx = qidx % 10; 
  console.log(pidx + " " + pQidx);
  let paginations = await driver.findElements(swd.By.css(".pagination ul li"));
  let nxtBtn = paginations[paginations.length - 2]; 
  let className = await nxtBtn.getAttribute("class");
  for (let i = 0; i < pidx; i++) {
    if (className == "disabled") {
      return null;
    }
    await nxtBtn.click(); 
    await waitForLoader();
    paginations = await driver.findElements(swd.By.css(".pagination ul li"));
    nxtBtn = paginations[paginations.length - 2];
    className = await nxtBtn.getAttribute("class");
  }  
  let challengeList = await driver.findElements(swd.By.css(".backbone.block-center"));
  if (challengeList.length > pQidx) {
    return challengeList[pQidx];
  } else {
    return null;
  }
}

async function Moderator(questionElement,ModToAdd){ 
  await questionElement.click();
  await driver.sleep(1500);
  let  ModTab= await driver.findElement(swd.By.css("li[data-tab=moderators]"));
  await ModTab.click();
  await driver.sleep(1500); 
  let ModInput = await driver.findElement(swd.By.css("#moderator"))
  await ModInput.sendKeys(ModToAdd);
  await ModInput.sendKeys(swd.Key.ENTER);
  await driver.sleep(1500);
  let saveBTn = await driver.findElement(swd.By.css(".save-challenge.btn.btn-green"));
  await saveBTn.click();
  await driver.sleep(1500);
  }

async function loginHelper() {
  await (await driver).manage().setTimeouts({ implicit: 10000, pageLoad: 10000 })
  let data = await fs.promises.readFile(cFile);
  let { url, pswd, user } = JSON.parse(data);
  // Login page
  await driver.get(url);
  let unInputWillBeFoundPromise = driver.findElement(swd.By.css("#input-1"));
  let psInputWillBeFoundPromise = driver.findElement(swd.By.css("#input-2"));
  let unNpsEl = await Promise.all([unInputWillBeFoundPromise, psInputWillBeFoundPromise]);
  let uNameWillBeSendPromise = unNpsEl[0].sendKeys(user);
  let pWillBeSendPromise = unNpsEl[1].sendKeys(pswd);
  await Promise.all([uNameWillBeSendPromise, pWillBeSendPromise]);
  let loginBtn = await driver.findElement(swd.By.css("button[data-analytics=LoginPassword]"));
  await loginBtn.click();
}
async function waitForLoader() {
  let loader = await driver.findElement(swd.By.css("#ajax-msg"));
  await driver.wait(swd.until.elementIsNotVisible(loader));
}


