
const sheetId = "10zL3bM0D1ZyXoY6C0bZ6KekOCSHpuqm7BmWXmPRRr_8"
// var spreadsheet = SpreadsheetApp.getActive();
const storageSize = 5
class fsHandler{
  getSpreadSheet(){
    return SpreadsheetApp.getActive()
  }
  getSheet(){
    return this.getSpreadSheet().getSheets()[0]
  }
  findIndexSync(filePath){
    return this.getSheet().getRange("A1:A"+storageSize).getValues().findIndex(e=>e[0]==filePath)
  }
  findAvailableMemorySync(){
    return this.getSheet().getRange("A1:A"+storageSize).getValues().findIndex(e=>e[0]=="")
  }
  existsSync(filePath){
    return this.findIndexSync(filePath)!=-1
  }
  writeFileSync(filePath, data, encoding){
    let index = this.findIndexSync(filePath)+1
    if(index==0)index = this.findAvailableMemorySync()+1
    let sheet = this.getSheet();
    sheet.getRange("A"+index).setValue(filePath)
    sheet.getRange("B"+index).setValue(data)
  }
  readFileSync(filePath, encoding){
    let index = this.findIndexSync(filePath)+1
    let sheet = this.getSheet();
    return sheet.getRange("B"+index).getValue()
  }
}
class pathHandler{
  resolve(path){
    return path;
  }
}
function require(name){ 
  switch(name){
    case("path"):
      return new pathHandler()
    case("fs"):
      return new fsHandler()
  }
}

class FetchResponse{
  constructor(ufr){
    this.textString = ufr.getContentText()
  }
  text(){
    return new Promise(r=>{r(this.textString)})
  }
}
function fetch(url, options){
  return new Promise((resolve)=>{
    let response = new FetchResponse(UrlFetchApp.fetch(url, options))
    resolve(response)
  })
}
function infinity(){
    // Replace this with all the code from v5.js but make sure to disable looping.
}