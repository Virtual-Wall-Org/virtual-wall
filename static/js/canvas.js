var canvas = this.__canvas = new fabric.Canvas('c');
// create a rect object

function CheckObjectToDraw() {
  e=document.getElementById("type_object");
  return e.options[e.selectedIndex].value;
}

current_object=null;
state=0;

function init()
{
  document.onkeydown = function(evt) {console.log(evt);deleteObject();}
  document.getElementById("clear").onclick=function(e) {clearCanvas()};
  canvas.on('mouse:down', function(options) {
    state=1;
    if (!options.target) {
      drawObject(options.pointer.x, options.pointer.y)
    }
  });

  canvas.on('mouse:up', function(options) {
    state=0;
    canvas.selection=true;
  });

  canvas.on('mouse:move', function(options) {
    if (state==1 && !options.target && current_object) {
      current_object.set({ x2: options.pointer.x, y2: options.pointer.y });
      canvas.renderAll(); 
    }
  });
}

function drawObject(x, y)
{
  current_object=null;
  switch(CheckObjectToDraw()) {
    case "line":
      addLine(x,y,x,y);
      break;
    case "rect":
      addRectangle(x,y);
      break;
    case "circle":
      addCircle(x,y);
      break;
    case "text":
      document.onkeydown=null;
      addIText(x,y);
      break;
    default:
      document.onkeydown = function(evt) {console.log(evt);deleteObject();}
      console.log("Not Defined");
  }
}

function addRectangle(x,y) {
  var rect = new fabric.Rect({
    left: x,
    top: y,
    fill: 'yellow',
    width: 200,
    height:100,
    objectCaching: false,
    stroke: 'lightgreen',
    strokeWidth: 4,
    originX: 'center', 
    originY: 'center' 
  });

  canvas.add(rect);
  canvas.setActiveObject(rect);
}

function addCircle(x,y) {
  canvas.selection=false;
  var circle = new fabric.Circle({radius: 100,
    left: x,
    top: y,
    fill: 'yellow',
    stroke: 'red',
    strokeWidth: 4,
    strokeWidth: 3,
    originX: 'center', 
    originY: 'center' 
  });
  canvas.add(circle);
  canvas.setActiveObject(circle);
}

function addLine(x,y) {
  canvas.selection=false;
  const line = new fabric.Line([x,y,x,y], {
    strokeWidth: 4,
    stroke: 'red',
    fill: 'red',
   });
  current_object=line;
  canvas.add(line);
}

function addIText(x,y) {
var iTextSample = new fabric.IText('hello\nworld', {
  left: x,
  top: y,
  fontFamily: 'Helvetica',
  fill: '#333',
  lineHeight: 1.1,
});
canvas.add(iTextSample);
}

function deleteObject() {
      for (target of canvas.getActiveObjects()) {
        canvas.remove(target);
        canvas.requestRenderAll(); 
      }
}

function clearCanvas() {
  canvas.clear();
}

init();