
"use strict";

let precision = 1,
simplification = 1,
imageToLoad = "source.png"
const key = {
  "None of the above":"."
}




let importedImg
let preview, pixelated, simplified
let output, cols, tilemap
let operated = false
let displayHeight = 90
const aspectRatio = 848/928
let importComplete = false;

let keyButton, calcButton, simplifyButton, pixelateButton, copyButton, importButton

function preload(){
  
}

function setup(){
  createCanvas(windowWidth, windowHeight)
  let scale = Math.min(windowWidth, windowHeight)
  resizeCanvas(scale * aspectRatio, scale * 1/aspectRatio)
  imageMode(CENTER)
  rectMode(CENTER)
  textFont("monospace")
  textAlign(CENTER, TOP)
  
  createButtons()
  createPreview()
}

function createButtons(){
  keyButton = createButton("Add Key")
  keyButton.mousePressed(addKey)
  keyButton.addClass("control")
  calcButton = createButton("Calculate")
  calcButton.mousePressed(calculate)
  calcButton.addClass("control")
  pixelateButton = createButton("Set Pixelation")
  pixelateButton.mousePressed(setPixelation)
  pixelateButton.addClass("control")
  simplifyButton = createButton("Set Colour Simplification")
  simplifyButton.mousePressed(setSimplification)
  simplifyButton.addClass("control")
  copyButton = createButton("Copy to Clipboard")
  copyButton.mousePressed(copyTilemap)
  copyButton.addClass("control")
  importButton = createFileInput(handleImage)
  importButton.addClass("control")
  moveButtons()
}

function handleImage(file) {
  importComplete = false;
  let img;
  if (file.type === 'image') {
    img = createImg(file.data, '');
    img.hide()
  } else {
    img = null;
  }
  if(img)createPreview(img)
}

function createPreview(img){
  if(img){
    preview = createGraphics(img.width, img.height)
    preview.clear()
    preview.background(100)
    preview.image(img, 0, 0, preview.width, preview.height)
    importComplete = true;
    importedImg = img;
    return;
  }
  importedImg = loadImage(imageToLoad, (importedImg) => {
    preview = createGraphics(importedImg.width, importedImg.height)
    preview.clear()
    preview.background(100)
    preview.image(importedImg, 0, 0, preview.width, preview.height)
    importComplete = true;
    }
  )
}

function calculate(){
  mainCalcs().then(() => {//tell stuff that it's done
    operated = true
    calcButton.removeClass("change")
  })
}

function copyTilemap(){
  copyToClipboard("[\""+tilemap.join("\",\n\"")+"\"]")
}

function copyToClipboard(text){
  let dummy = document.createElement("textarea")
  document.body.appendChild(dummy)
  dummy.value = text
  dummy.select()
  document.execCommand("copy") //deprecated
  document.body.removeChild(dummy)
}

async function mainCalcs(){
  pixelated = getPixelatedImage(preview, precision)
  simplified = getSimplifiedImage(pixelated.img, simplification)
  let map = toTileMap(pixelated.map)
  tilemap = map
  output = ""+
    "Tile Map: \n\n"+
    twoDimensionalArrayToText(map)+
    "\nTile Size: "+
    precision+
    "\nMap Size: "+
    map[0].length + " x " + map.length
}

function windowResized(){
  let scale = Math.min(windowWidth, windowHeight)
  resizeCanvas(scale * aspectRatio, scale * 1/aspectRatio)
  moveButtons()
}

function moveButtons(){
  keyButton.position(width/7 * 5, 50)
  calcButton.position(width/7 * 4, 50)
  simplifyButton.position(width/7 * 2, 50)
  pixelateButton.position(width/7, 50)
  copyButton.position(width/5 - 60, displayHeight + width/4 + 50)
  importButton.position(width/2, 15)
}

function addKey(){
  let inputColour = prompt("Enter the new colour for the key in the form 'r,g,b':")
  if(/^[0-9]{1,3},[0-9]{1,3},[0-9]{1,3}$/.test(inputColour.trim())){
    let inputCharacter = prompt("Enter the character that the colour '"+inputColour+"' will turn into:")
    if(/^[a-zA-Z=\.]$/.test(inputCharacter.trim())){
      Object.defineProperty(key, inputColour, {
        value: inputCharacter
      })
      console.log(inputColour+" , "+inputCharacter+" => ",key)
    }
  }
}

function setSimplification(){
  let inputSimplification = prompt("Enter colour simplification level as a number between 1 and 255.\n\nHigher numbers mean fewer tiles to define.")
  let numSimplification = parseInt(inputSimplification)
  if(numSimplification <= 255 && numSimplification >= 1){
    simplification = numSimplification
  }
  calcButton.addClass("change")
}

function setPixelation(){
  let inputPrecision = prompt("Enter pixelation level as a number between 1 and "+preview.width+".\n\nHigher numbers mean a smaller but less accurate tilemap.")
  let numPrecision = parseInt(inputPrecision)
  if(numPrecision <= preview.width && numPrecision >= 1){
    precision = numPrecision
  }
  calcButton.addClass("change")
}

function draw(){
  clear()
  background(0)
  fill(100)
  rect(width/2, 90 +(width/8) - 20, width, width/4 + 40)
  if(importComplete){
    if(preview.width <= 0 || preview.height <= 0){
      createPreview(importedImg)
    }
    simplified?display(simplified, width/4, width/5 * 4, displayHeight, true):{}
    pixelated?display(pixelated, width/4, undefined, displayHeight, true):{}
    preview?display(preview, width/4, width/5, displayHeight, true):{}
  }
  if(operated){
    //Map
    push()
    let widthBasedSize = Math.min(width/7, textWidth(output))/textWidth(output) * 20
    textSize(widthBasedSize)
    let outputHeight = output.split("\n").length * textSize()
    let heightBasedSize = Math.min(height - 300, outputHeight)/outputHeight * 20
    console.log("width", widthBasedSize, ", height", heightBasedSize)
    textSize(Math.min(widthBasedSize, heightBasedSize))
    text(output, width/5, displayHeight + width/4 + 100)
    pop()

    //Colours
    text("Colours Present:", width/5 * 4, displayHeight + width/4 + 100)
    let cols = getUniqueElements(toColourStringArray(pixelated.map).flat())
    showColourStrings(cols, width/5 * 4, displayHeight + width/4 + 150)
    text("Key Defined For:", width/5 * 2.5, displayHeight + width/4 + 100)
    let keys = Object.getOwnPropertyNames(key)
    showColourKeys(keys, width/5 * 2.5, displayHeight + width/4 + 150)
    let endOfKeys = displayHeight + width/4 + 150 + keys.length * (textSize() + 3)
    text("Missing:", width/5 * 2.5, endOfKeys + 20)
    showColourStrings(getNonIntersectingElements(cols, keys), width/5 * 2.5, endOfKeys + 50)
  }
}


function display(input, scale = 400, x = width/2, y = 220, offsetVertically = false){
  push()
  let img
  if(input.multipart){
    img = input.img
  }
  else{
    img = input
  }
  if(img.width <= 0 || img.height <= 0){
    pop()
    return;
  }
  const pictSize = Math.max(img.width, img.height)
  const scaleFactor = scale/pictSize
  image(img, x, y + (offsetVertically?img.height*scaleFactor/2:0), img.width*scaleFactor, img.height*scaleFactor)
  const infoText = `Size: ${img.width} by ${img.height} | `+(input.multipart?(`${input.multipart?input.effectName:""}: ${input.multipart?input.effectScale:""}`):"Original")
  textSize(scale/textWidth(infoText)* 12)
  fill(255)
  text(infoText, x, y + scale/2 + 30+ (offsetVertically?img.height*scaleFactor/2:0))
  pop()
}

/** Gets every nth pixel from the source, and puts it on a destination image. Will produce a smaller image. */
function getPixelatedImage(source, precision){
  source.loadPixels()
  let dest = createGraphics(source.width, source.height)
  let map = {width: source.width/precision, height: source.height/precision, pixels: []}
  const len = source.pixels.length
  const wid = source.width
  const hei = source.height
  let stored
  for(let x = 0; x < wid; x += precision){
    for(let y = 0; y < hei; y += precision){
      let pos = (x + wid*y) * 4
      map.pixels.push({x: x/precision, y: y/precision, colour: [source.pixels[pos], source.pixels[pos + 1], source.pixels[pos + 2]]})
      dest.noStroke()
      dest.fill(source.pixels[pos], source.pixels[pos + 1], source.pixels[pos + 2]);
      dest.rect(x, y, precision, precision);
    }
  }
  source.updatePixels()
  return {multipart: true, img: dest, effectScale: precision, effectName: "Pixelation", map: map}
}

function getSimplifiedImage(source, blendAmount){
  source.loadPixels()
  let dest = createGraphics(source.width, source.height)
  dest.loadPixels()
  let map = {width: source.width/blendAmount, height: source.height/blendAmount, pixels: []}
  const len = source.pixels.length
  const wid = source.width
  const hei = source.height
  for(let i = 0; i < len; i++){
    [dest.pixels[i],dest.pixels[i+1],dest.pixels[i+2]] = simplifyColour([source.pixels[i], source.pixels[i + 1], source.pixels[i + 2]], blendAmount)
  }
  source.updatePixels()
  dest.updatePixels()
  return {multipart: true, img: dest, effectScale: blendAmount, effectName: "Simplification", map: map}
}

function toTileMap(map){
  let tilemap = []
  const hght = Math.round(map.height)
  const wdth = Math.round(map.width)
  for(let y = 0; y < hght; y++){
    let row = ""
    for(let x = 0; x < wdth; x++){
      row += toTile(simplifyColour(getPixelFromPos(map, x, y).colour, simplification)) 
    }
    tilemap.push(row)
  }
  return tilemap
}

function toColourArray(map){
  let arr = []
  const hght = Math.round(map.height)
  const wdth = Math.round(map.width)
  for(let y = 0; y < hght; y++){
    let row = []
    for(let x = 0; x < wdth; x++){
      row.push(simplifyColour(getPixelFromPos(map, x, y).colour, simplification)) 
    }
    arr.push(row)
  }
  return arr
}

function toColourStringArray(map){
  let arr = []
  const hght = Math.round(map.height)
  const wdth = Math.round(map.width)
  for(let y = 0; y < hght; y++){
    let row = []
    for(let x = 0; x < wdth; x++){
      row.push(simplifyColour(getPixelFromPos(map, x, y).colour, simplification).toString()) 
    }
    arr.push(row)
  }
  return arr
}

function getPixelFromPos(map, x, y){
  const len = map.pixels.length
  for(let i = 0; i < len; i++){
    let px = map.pixels[i]
    //console.log("looking for: x: "+x+" y: "+y+"\nwidth: "+map.width+" height: "+map.height+"\ngot: x: "+px.x+" y: "+px.y+" pixel "+px.colour)
    if(px.x === x && px.y === y){
      //console.log("found!")
      return px
    }
  }
  return {colour: null}
}

function toTile(colour){
  if(!colour) return "!"
  let str = colour.toString()
  return (str in key)?key[colour.toString()]:key["None of the above"]
} //converter for colour array to letters

function twoDimensionalArrayToText(array2d){ //works
  let text = ""
  for(let y = 0; y < array2d.length; y++){
    let line = ""
    for(let x = 0; x < array2d[y].length; x++){
      line += array2d[y][x]
    }
    text += line + "\n"
  }
  return text
}

function simplifyColour(col, simplification){
  let newCol = []
  for(let c of col){
    newCol.push(Math.round(c/simplification)*simplification)
  }
  return newCol
}

function getUniqueElements(array){
  let elems = []
  for(let i of array){
    if(!elems.includes(i)){
      elems.push(i)
    }
  }
  return elems
}

function showColourStrings(arr, x, y){
  push()
  rectMode(CENTER)
  textAlign(CENTER, CENTER) 
  let showX = x,
    showY = y
  for(let col of arr){
    let split = col.split(",");
    split.forEach(element => parseInt(element))
    if(split.length === 3){
      push()
      stroke(255)
      fill(...split)
      rect(showX - (textWidth(col)/2 + 20), showY, textSize()-3, textSize()-3)
      pop()
    }
    noStroke()
    text(col, showX, showY)
    showY += textSize() + 3
  }
  pop()
}

function showColourKeys(arr, x, y){
  push()
  rectMode(CENTER)
  textAlign(CENTER, CENTER) 
  let showX = x,
    showY = y
  for(let col of arr){
    let split = col.split(",");
    split.forEach(element => parseInt(element))
    let txt = col + ": '" + toTile(col)+"'"
    if(split.length === 3){
      push()
      stroke(255)
      fill(...col.split(","))
      rect(showX - (textWidth(txt)/2 + 20), showY, textSize()-3, textSize()-3)
      pop()
    }
    noStroke()
    text(txt, showX, showY)
    showY += textSize() + 3
  }
  pop()
}

/** Gets elements from `arr1` not in `arr2` */
function getNonIntersectingElements(arr1, arr2){
  let elems = []
  for(let i of arr1){
    if(!arr2.includes(i)){
      elems.push(i)
    }
  }
  return elems
}