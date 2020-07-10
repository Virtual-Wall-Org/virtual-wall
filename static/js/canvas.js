var canvas = this.__canvas = new fabric.Canvas('c');
// create a rect object

var lastTimeout = undefined;

function CheckObjectToDraw() {
  e=document.getElementById("type_object");
  return e.options[e.selectedIndex].value;
}

function saveContent(){
	var hash = $(location).attr('hash').substr(1);
	clearTimeout(lastTimeout);
	lastTimeout = setTimeout(function() {
		document.getElementById("api-status").innerText = "Saving data...";
		$.ajax({
			method: "PUT",
			url: "/api/wall/" + hash + "/content",
			contentType: "application/json",
			data: JSON.stringify(canvas.toDatalessJSON()),
		}).done(function(response) {
			document.getElementById("api-status").innerText = "Data saved.";
			console.log(response);
		});
	}, 1000);

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

	canvas.on('object:modified', function(options) {
		saveContent();
	});

	canvas.on('object:added', function(options) {
		saveContent();
	});

	canvas.on('object:removed', function(options) {
		saveContent();
	});

	var hash = $(location).attr('hash').substr(1);
	$("#wall-id").text("Welcome to the " + hash + " wall");

	document.getElementById("api-status").innerText = "Loading data...";
	jQuery.get("/api/wall/" + hash + "/content", function( data ) {
		document.getElementById("api-status").innerText = "Data loaded.";
		console.log(data);
		canvas.loadFromJSON(data, function(obj) {
			canvas.renderAll();
		});
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