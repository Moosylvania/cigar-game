const INK = '#294844'
const GLASS = '#bde8e7'

/** Shared fleet illustrations for the map and previews. The nose follows the route. */
export function drawVehicleSprite(ctx, tierId, direction, rect, time = 0) {
  ctx.save()
  ctx.translate(rect.x + rect.width / 2, rect.y + rect.height / 2)
  ctx.rotate(({ e: 0, s: Math.PI / 2, w: Math.PI, n: -Math.PI / 2 })[direction] ?? 0)
  // Uniform scaling keeps articulated vehicles and wheels in proportion.
  const scale = Math.min(rect.width, rect.height) / 100
  ctx.scale(scale, scale)
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.35
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  const box = (x,y,w,h,color,r=1) => {
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();ctx.stroke()
  }
  const poly = (points,color) => {
    ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.stroke()
  }
  const line = (x,y,x2,y2) => {ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}
  const oval = (x,y,rx,ry,color) => {ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.stroke()}
  const wheel = (x,y,r=3.5,train=false) => {
    oval(x,y,r,r,INK);oval(x,y,r*.52,r*.52,train?'#bacac1':'#d8d6bc')
    const a=time/180
    ctx.strokeStyle='#e7eee2';line(x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.65,x-Math.cos(a)*r*.65,y-Math.sin(a)*r*.65);ctx.strokeStyle=INK
  }
  const bogie = (x,y) => {box(x-4,y-1,8,2,INK);wheel(x-2.6,y+1,2.1,true);wheel(x+2.6,y+1,2.1,true)}
  const crate = (x,y,w=8,h=8) => {box(x,y,w,h,'#d1a86d');line(x+1,y+1,x+w-1,y+h-1);line(x+w-1,y+1,x+1,y+h-1)}
  const coupling = (x,y,w=5) => {ctx.lineWidth=2.2;line(x,y,x+w,y);ctx.lineWidth=1.35}
  const train = ['cargo_train','freight_train','bullet_train'].includes(tierId)
  ctx.save();ctx.globalAlpha*=.18
  ctx.beginPath();ctx.ellipse(0,19,train?47:41,5,0,0,Math.PI*2);ctx.fillStyle=INK;ctx.fill();ctx.restore()
  ctx.translate(0,time?Math.sin(time/(train?420:160))*(train?.18:.45):0)

  if(tierId==='cargo_train') {
    // Steam locomotive, driving wheels, tender, and an open cargo wagon.
    for(const x of [-37,-21])wheel(x,15,3,true)
    box(-46,-3,33,16,'#769d70');box(-47,11,35,3,'#aac496')
    for(const x of [-43,-33,-23]){crate(x,-7,8,10);line(x,0,x,9)}
    coupling(-12,11)
    box(-7,-2,13,15,'#608360');poly([[-6,-2],[0,-6],[5,-2]],'#40594e')
    wheel(-3,16,3,true);wheel(4,16,3,true)
    coupling(6,11,4)
    box(10,-14,13,26,'#76a375');box(8,-16,17,3,'#45694d')
    box(13,-11,7,8,GLASS)
    box(23,-3,19,15,'#76a375',5);oval(41,4,3,7,'#557d58')
    box(33,-13,5,11,'#455f54');box(31,-15,9,3,'#78947b')
    oval(27,-4,3,4,'#d3b65d');box(9,11,34,3,'#b8ce98')
    wheel(16,15,4.4,true);wheel(27,15,4.4,true);wheel(37,15,3,true)
    ctx.strokeStyle='#d7dcc0';ctx.lineWidth=1.8
    const a=time/180;line(16+Math.cos(a)*2,15+Math.sin(a)*2,27+Math.cos(a)*2,15+Math.sin(a)*2)
    ctx.strokeStyle=INK;ctx.lineWidth=1.35
    poly([[42,9],[48,17],[41,17]],'#d1b365');oval(44,1,1.5,1.5,'#fff0ae')
    if(time)for(let i=0;i<3;i++){const p=(time/1500+i/3)%1;ctx.save();ctx.globalAlpha*=.45*(1-p);oval(35-p*12,-18-p*12,2+p*4,2+p*3,'#dce6d9');ctx.restore()}
  } else if(tierId==='freight_train') {
    // Two independent container cars and a long-hood diesel locomotive.
    for(const [x,w,color] of [[-47,24,'#b77c63'],[-19,24,'#789bb5']]) {
      box(x,-9,w,21,color);poly([[x,-9],[x+3,-13],[x+w,-13],[x+w,-9]],'#aac2bf')
      for(let rib=x+4;rib<x+w;rib+=4)line(rib,-7,rib,9)
      box(x-1,12,w+2,2,'#566f68');bogie(x+5,16);bogie(x+w-5,16)
      coupling(x+w,12,4)
    }
    box(10,-1,35,14,'#567fa3');box(11,-8,18,12,'#819ec6')
    box(29,-15,12,24,'#819ec6');box(28,-17,15,3,'#bdcbd2')
    box(32,-12,7,7,GLASS)
    poly([[41,-4],[47,2],[47,13],[41,13]],'#819ec6')
    for(let x=14;x<27;x+=4)line(x,-5,x,2)
    box(11,6,34,3,'#e4c772');box(9,12,39,3,'#445e68')
    bogie(17,17);bogie(39,17);box(45,0,2,3,'#fff0ae')
    for(const x of [14,23])box(x,-11,4,3,'#405960')
  } else if(tierId==='bullet_train') {
    // Continuous low carriages, flexible joints, and a genuinely pointed nose.
    for(const [x,w] of [[-47,25],[-18,25]]) {
      box(x,-8,w,22,'#e9e6d7',4);box(x+3,-5,w-6,5,'#527f91',1)
      box(x,7,w,2,'#6abec5',0);bogie(x+6,16);bogie(x+w-6,16)
      box(x+w,0,4,10,'#435d61',1)
    }
    ctx.beginPath();ctx.moveTo(11,-8);ctx.lineTo(26,-8);ctx.bezierCurveTo(34,-8,41,1,48,9);ctx.quadraticCurveTo(49,14,42,14);ctx.lineTo(11,14);ctx.closePath();ctx.fillStyle='#e9e6d7';ctx.fill();ctx.stroke()
    poly([[27,-5],[33,-3],[38,2],[29,2]],'#527f91')
    box(14,-5,9,5,'#527f91',1);ctx.strokeStyle='#6abec5';ctx.lineWidth=2;line(12,8,43,8);ctx.strokeStyle=INK;ctx.lineWidth=1.35
    bogie(19,16);oval(44,10,1.5,.8,'#fff0ae')
    // Roof-mounted pantograph reads as electric rail rather than a road vehicle.
    line(-10,-9,-5,-15);line(-5,-15,1,-9);line(-8,-15,-2,-15)
  } else if(tierId==='semi') {
    // Separate trailer and tractor, visible hitch, and paired rear axles.
    box(-46,-18,56,31,'#d88b77',2)
    poly([[-46,-18],[-42,-22],[10,-22],[10,-18]],'#efb298')
    for(let x=-40;x<7;x+=7){ctx.strokeStyle='#eeb6a0';line(x,-14,x,9)}ctx.strokeStyle=INK
    box(-47,12,59,3,'#52736c');wheel(-37,17);wheel(-27,17)
    coupling(11,10,6);box(14,9,32,5,'#52736c')
    box(17,-12,10,23,'#c77364');poly([[27,-15],[36,-15],[41,-2],[47,1],[47,12],[27,12]],'#e08473')
    poly([[29,-12],[35,-12],[38,-3],[29,-3]],GLASS)
    wheel(20,17);wheel(29,17);wheel(41,17)
    box(44,2,3,3,'#fff0ae');line(45,7,48,7);line(24,-17,24,-5)
  } else if(tierId==='box_truck') {
    // A tall enclosed cargo box and a shorter cab, with a roll-up rear door.
    box(-37,-21,46,35,'#72b3bd',2)
    poly([[-37,-21],[-32,-25],[9,-25],[9,-21]],'#acd4d1')
    box(-37,-17,5,29,'#c0d9d2',0)
    for(let y=-13;y<10;y+=5)line(-36,y,-33,y)
    poly([[12,-12],[28,-12],[35,-1],[40,2],[40,14],[12,14]],'#72b3bd')
    poly([[16,-9],[26,-9],[31,-2],[16,-2]],GLASS)
    box(-39,13,80,3,'#52736c');wheel(-23,17,4.5);wheel(28,17,4.5)
    box(36,3,4,3,'#fff0ae');line(18,3,22,3)
    box(-25,-10,22,9,'#dce6d7',1)
  } else {
    // Pickup: an exposed bed, a single cab, hood, and two large road wheels.
    box(-37,-2,34,15,'#e8bc57');box(-35,-7,31,6,'#af824e')
    crate(-31,-12,12,11);crate(-17,-9,10,8)
    poly([[-2,-17],[14,-17],[22,-3],[36,-1],[40,5],[40,14],[-2,14]],'#e8bc57')
    poly([[2,-14],[12,-14],[18,-4],[2,-4]],GLASS)
    box(-38,12,79,4,'#d8b466');wheel(-24,17,5);wheel(27,17,5)
    box(36,2,4,4,'#fff0ae');line(4,2,9,2);line(-35,3,-7,3)
  }
  ctx.restore()
}
