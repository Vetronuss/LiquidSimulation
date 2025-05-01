

var sim
var addButton;

function yerp()
{
    for (var o = 0; o < 100; o++)
        sim.addDrop();
}

function setup()
{
    //colorMode(HSL);
    let cnv = createCanvas(windowWidth, windowHeight);
    
  // ensure p5 uses it:
  //drawingContext = realCtx;

    sim = new LiquidSim(100,100,800,400);
    addButton = createButton("add drop");
    addButton.position(0,0);
    addButton.mousePressed(yerp);
}




function draw()
{
    background(100)
    sim.draw();
}