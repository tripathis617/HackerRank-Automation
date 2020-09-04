let fs = require("fs");
require("chromedriver");
let swd = require("selenium-webdriver");
let bldr = new swd.Builder();
let driver = bldr.forBrowser("chrome").build();

let cFile = process.argv[2];
let questionsFile = process.argv[3];
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
    // let adminPageUrl = await adminLinkanchor.getAttribute("href");
    // await driver.get(adminPageUrl);
    // stale element => selected elements were in the page but they are not currently here
    await waitForLoader();
    let manageTabs = await driver.findElements(swd.By.css(".administration header ul li"));
    await manageTabs[1].click();
    let ManageChallengePage = await driver.getCurrentUrl();
    //Json file read
    let questions = require(questionsFile);
    
    // Create Challenge
    for (let i = 0; i < questions.length; i++) {
      await driver.get(ManageChallengePage);
      await waitForLoader();
      await createNewChallenge(questions[i]);
    }
    
    // Add Test Cases
    // for (let i = 0; i < questions.length; i++) {
    //   await driver.get(ManageChallengePage);
    //   await waitForLoader();
    //   let questionElement = await GetMeQuestion(i);
    //   await TestCases(questionElement,questions[i]["Testcases"]);
    // }

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

async function TestCases(questionElement,Testcase){ 
  await questionElement.click();
  await driver.sleep(1500);
  let Qurl = await driver.getCurrentUrl();
  console.log(Testcase.length);  
  for(let i=0;i<Testcase.length;i++){
    await driver.get(Qurl);
    await driver.sleep(1500);
    let testcasetab = await driver.findElements(swd.By.css(".tabs-cta-wrapper ul li"));
    await testcasetab[2].click(); 
    await waitForLoader();
    let Addtestcase = await driver.findElement(swd.By.css(".btn.add-testcase.btn-green"));
    await Addtestcase.click();
    let inputTA = await driver.findElement(swd.By.css('.formgroup.horizontal.input-testcase-row.row .CodeMirror.cm-s-default.CodeMirror-wrap div textarea'));
    let outputTA = await driver.findElement(swd.By.css('.formgroup.horizontal.output-testcase-row.row .CodeMirror.cm-s-default.CodeMirror-wrap div textarea'));
    await editorHandler(".formgroup.horizontal.input-testcase-row.row .CodeMirror.cm-s-default.CodeMirror-wrap div", inputTA, Testcase[i]["Input"]);
    await editorHandler(".formgroup.horizontal.output-testcase-row.row .CodeMirror.cm-s-default.CodeMirror-wrap div", outputTA, Testcase[i]["Output"]);
    let saveBtn = await driver.findElement(swd.By.css(".btn.btn-primary.btn-large.save-testcase"));
    await saveBtn.click();
    await driver.sleep(1500);
  }
  return;
}

async function createNewChallenge(question) {
  let createChallenge = await driver.findElement(swd.By.css(".btn.btn-green.backbone.pull-right"));
  await createChallenge.click();
  await waitForLoader();
  let eSelector = ["#name", "textarea.description", "#problem_statement-container .CodeMirror div textarea", "#input_format-container .CodeMirror textarea", "#constraints-container .CodeMirror textarea", "#output_format-container .CodeMirror textarea", "#tags_tag"];
  // let AllSelectors = [];
  // for (let i = 0; i < eSelector.length; i++) {
  //   let elemWillBeFoundPromise =driver.findElement(swd.By.css(eSelector[i]));
  //   AllSelectors.push(elemWillBeFoundPromise);
  // }
  let eWillBeselectedPromise = eSelector.map(function (s) {
    return driver.findElement(swd.By.css(s));
  })
  let AllElements = await Promise.all(eWillBeselectedPromise);
  let NameWillAddedPromise = AllElements[0].sendKeys(question["Challenge Name"]);
  let descWillAddedPromise = AllElements[1].sendKeys(question["Description"]);
  await Promise.all([NameWillAddedPromise, descWillAddedPromise]);
  // console.log("name and desc added");
  // code editor
  await editorHandler("#problem_statement-container .CodeMirror div", AllElements[2], question["Problem Statement"]);
  await editorHandler("#input_format-container .CodeMirror div", AllElements[3], question["Input Format"]);
  await editorHandler("#constraints-container .CodeMirror div", AllElements[4], question["Constraints"]);
  await editorHandler("#output_format-container .CodeMirror div", AllElements[5], question["Output Format"]);
  // tags
  let TagsInput = AllElements[6];
  await TagsInput.sendKeys(question["Tags"]);
  await TagsInput.sendKeys(swd.Key.ENTER);
  // submit 
  let saveChangesBtn = await driver.findElement(swd.By.css(".save-challenge.btn.btn-green"))
  await saveChangesBtn.click();

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
async function editorHandler(parentSelector, element, data) {
  let parent = await driver.findElement(swd.By.css(parentSelector));
  await driver.executeScript("arguments[0].style.height='10px'", parent);
  await element.sendKeys(data);
}

