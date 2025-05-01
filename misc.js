
var config = {
    interactionRadius:   18,
    interactionStrength: 0.015,
    viscosityCoeff:      0.01,
    buoyancyForce:       0.05,
    gravity:             0.5,
    drag:                0.88,
    maxForce:            1.5,
    desiredSpacing:      20,
    strictMinDistance:   10,
    restitutionX:        -0.8,
    restitutionYTop:     -0.8,
    restitutionYBottom:  -0.6,
    friction:            0.9,
    initVelX:            [-4, 4],
    initVelY:            [-2, 2],
    particleSize:        14,
    sizeWeight:          1
  };
  

  
  function drawHull(points) {
    const n = points.length;
    if (n < 3) return;
    let hull = [], left = 0;
    for (let i = 1; i < n; i++) if (points[i].x < points[left].x) left = i;
    let p = left;
    do {
      hull.push(points[p]);
      let q = (p + 1) % n;
      for (let r = 0; r < n; r++) {
        if (r === p) continue;
        let apx = points[q].x - points[p].x,
            apy = points[q].y - points[p].y,
            arx = points[r].x - points[p].x,
            ary = points[r].y - points[p].y;
        if (apx*ary - apy*arx < 0) q = r;
      }
      p = q;
    } while (p !== left);
    beginShape();
    for (let v of hull) vertex(v.x, v.y);
    noStroke(); fill(100,200,200,100);
    endShape(CLOSE);
  }
  
  function metaballs(rx, ry, rw, rh, centers, threshold = 1, scale = 1) {
    // reuse buffer on sim object
    let buf = this._metabuf || (this._metabuf = createImage(floor(rw*scale)||1, floor(rh*scale)||1));
    let sw = buf.width, sh = buf.height;
    buf.loadPixels();
    const px = buf.pixels;
    const n  = centers.length;
    for (let j = 0, idx=0; j < sh; j++) {
      let y = ry + (j+0.5)/scale;
      for (let i = 0; i < sw; i++, idx+=4) {
        let x = rx + (i+0.5)/scale, sum = 0;
        for (let k = 0; k < n; k++) {
          let c = centers[k],
              dx = x - c.x, dy = y - c.y,
              d2 = dx*dx + dy*dy;
          if (d2>0) sum += (c.z||1)/d2;
        }
        if (sum >= threshold) {
          px[idx]=px[idx+1]=px[idx+2]=px[idx+3]=255;
          px[idx+3]=100
        } else px[idx+3]=0;
      }
    }
    buf.updatePixels();
    return buf;
  }
  
  class Particle {
    constructor(x,y) {
      this.x = x; this.y = y;
      this.vx = random(config.initVelX[0],config.initVelX[1]);
      this.vy = random(config.initVelY[0],config.initVelY[1]);
      this.size = config.particleSize;
    }
    update(ps, b) {
      let ax=0, ay=0, px=this.x, py=this.y;
      for (let o of ps) {
        if (o===this) continue;
        let dx = px - o.x, dy = py - o.y;
        let d2 = dx*dx + dy*dy;
        let minDist2 = config.strictMinDistance * config.strictMinDistance;
if (d2 < minDist2 && d2 > 0) {
  let d = sqrt(d2), overlap = (config.strictMinDistance - d)*0.5;
  let ux = dx/d*overlap, uy = dy/d*overlap;
  this.x += ux; this.y += uy;
  o.x   -= ux; o.y   -= uy;
  continue;
} else if (d2 < config.desiredSpacing*config.desiredSpacing && d2 > 0) {
  let d = sqrt(d2), overlap = (config.desiredSpacing - d)*0.5;
  let ux = dx/d*overlap, uy = dy/d*overlap;
  this.x += ux; this.y += uy;
  o.x   -= ux; o.y   -= uy;
  continue;
}
        if (d2 < config.interactionRadius*config.interactionRadius) {
          let d = sqrt(d2),
              rep = (config.interactionRadius - d)*config.interactionStrength;
          ax += dx/d*rep + (o.vx - this.vx)*config.viscosityCoeff;
          ay += dy/d*rep + (o.vy - this.vy)*config.viscosityCoeff;
        }
      }
      let aMag = ax*ax + ay*ay;
      if (aMag > config.maxForce*config.maxForce) {
        let m = config.maxForce/sqrt(aMag);
        ax *= m; ay *= m;
      }
      this.vx = (this.vx + ax)*config.drag;
      this.vy = (this.vy + ay + (config.gravity - config.buoyancyForce))*config.drag;
      this.x += this.vx;
      this.y += this.vy;
      let l=b.x, r=b.x+b.width, t=b.y, bt=b.y+b.height, r2=this.size/2;
      if (this.x<l+r2) { this.x=l+r2; this.vx*=config.restitutionX; }
      else if (this.x>r-r2) { this.x=r-r2; this.vx*=config.restitutionX; }
      if (this.y<t+r2) { this.y=t+r2; this.vy*=config.restitutionYTop; }
      else if (this.y>bt-r2) {
        this.y=bt-r2; this.vy*=config.restitutionYBottom; this.vx*=config.friction;
      }
      
      circle(this.x,this.y,this.size*config.sizeWeight)
    }
  }
  
  

  class LiquidSim {

    constructor(x,y,w,h) {
      Object.assign(this,{x,y,width:w,height:h});
      this.particles = [];

      this.num = 0;
    }
    addDrop() {
      let px = random(this.x,this.x+this.width);
      this.particles.push(new Particle(px,this.y));
      this.num++;
    }
    draw() {
      push();
      stroke(0); strokeWeight(2); noFill();
      rect(this.x,this.y,this.width,this.height);
      textAlign(LEFT,BOTTOM);
      textSize(20);
      text(getFps(),this.x,this.y)
      noStroke();
      fill(100,200,200,100);
      
      
      for (let p of this.particles) p.update(this.particles,this);

      //drawHull(this.particles);
      pop();
      //let img = metaballs.call(this,this.x,this.y,this.width,this.height,this.particles,0.02,0.25);
      //image(img,this.x,this.y,this.width,this.height);
    }
  }




  
  