const $ = (id) => document.getElementById(id);
const simScreen = $("simScreen"), grid = $("sensorGrid"), touchLayer = $("touchLayer");
const sensitivity = $("sensitivity"), fingerSize = $("fingerSize"), interference = $("interference"), multiTouch = $("multiTouch");
const cells = [];
const COLS = 12, ROWS = 8;
let touches = [];
let lastResponse = 0;

function buildGrid() {
  grid.innerHTML = "";
  cells.length = 0;
  for (let y=0; y<ROWS; y++) for (let x=0; x<COLS; x++) {
    const cell = document.createElement("span");
    cell.className = "sensor-cell";
    cell.dataset.x = x; cell.dataset.y = y;
    grid.appendChild(cell); cells.push(cell);
  }
}
function getSettings() {
  return { sensitivity:+sensitivity.value, finger:+fingerSize.value, noise:+interference.value };
}
function responseAt(point, settings) {
  // Educational approximation: larger contact area and higher sensitivity
  // increase the model response; noise reduces confidence.
  const sizeFactor = settings.finger / 50;
  const raw = 42 + settings.sensitivity * .48 + sizeFactor * 8 - settings.noise * .42;
  return Math.max(0, Math.min(100, raw));
}
function render() {
  const s = getSettings();
  cells.forEach(cell => {
    const cx = (Number(cell.dataset.x)+.5)/COLS*100;
    const cy = (Number(cell.dataset.y)+.5)/ROWS*100;
    let strength = 0;
    touches.forEach(t => {
      const dx = (cx-t.x)*simScreen.clientWidth/100;
      const dy = (cy-t.y)*simScreen.clientHeight/100;
      const radius = 18 + s.finger*.43;
      const distance = Math.sqrt(dx*dx+dy*dy);
      const local = Math.max(0, 1-distance/radius);
      strength = Math.max(strength, local);
    });
    const noisy = s.noise > 75 && Math.random() < (s.noise-75)/400;
    const detected = touches.length && strength > 0 && responseAt(null,s) > 38 && s.sensitivity > 8;
    cell.classList.toggle("active", !!detected && strength > .08 && !noisy);
  });
  touchLayer.innerHTML = "";
  touches.forEach(t => {
    const p = document.createElement("span");
    p.className = "touch-point"; p.style.left=t.x+"%"; p.style.top=t.y+"%";
    touchLayer.appendChild(p);
  });
  const count = touches.length;
  $("touchCount").textContent = count + (count===1 ? " touch" : " touches");
  if (!count) {
    $("touchStatus").textContent="Waiting"; $("xValue").textContent="—"; $("yValue").textContent="—";
    $("responseValue").textContent="0%"; $("statusPill").textContent="READY";
    $("screenHint").style.display="block"; lastResponse=0;
    return;
  }
  $("screenHint").style.display="none";
  const response = Math.round(responseAt(touches[0],s));
  const detected = s.sensitivity > 8 && response > 38;
  $("touchStatus").textContent = detected ? "Detected" : "Weak signal";
  $("touchStatus").style.color = detected ? "var(--green)" : "var(--orange)";
  $("xValue").textContent = Math.round(touches[0].x/100*(COLS-1)+1);
  $("yValue").textContent = Math.round(touches[0].y/100*(ROWS-1)+1);
  $("responseValue").textContent = response+"%";
  $("statusPill").textContent = detected ? (s.noise>70?"NOISY":"DETECTED") : "LOW SIGNAL";
  $("statusPill").style.color = detected ? "var(--green)" : "var(--orange)";
  lastResponse=response;
}
function updateLabels() {
  $("sensitivityValue").textContent=sensitivity.value+"%";
  $("fingerValue").textContent=fingerSize.value+"%";
  $("interferenceValue").textContent=interference.value+"%";
  render();
}
simScreen.addEventListener("pointerdown", (event) => {
  const rect=simScreen.getBoundingClientRect();
  const point={x:Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100)),y:Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100))};
  if (multiTouch.checked) { touches.push(point); if(touches.length>2) touches.shift(); }
  else touches=[point];
  render();
});
[sensitivity,fingerSize,interference].forEach(el=>el.addEventListener("input",updateLabels));
multiTouch.addEventListener("change",()=>{if(!multiTouch.checked && touches.length>1) touches=touches.slice(-1);render();});
$("resetBtn").addEventListener("click",()=>{touches=[];render();});
document.querySelectorAll(".exp-button").forEach(btn=>btn.addEventListener("click",()=>{
  const type=btn.dataset.experiment;
  if(type==="sensitivity"){sensitivity.value=25;interference.value=5;multiTouch.checked=false;touches=[{x:50,y:50}];}
  if(type==="multi"){sensitivity.value=70;interference.value=5;multiTouch.checked=true;touches=[{x:35,y:45},{x:68,y:58}];}
  if(type==="noise"){sensitivity.value=70;interference.value=88;multiTouch.checked=false;touches=[{x:50,y:50}];}
  updateLabels(); $("lab").scrollIntoView({behavior:"smooth"});
}));
buildGrid(); updateLabels();

// Decorative hero sensor grid
const heroGrid=$("heroGrid");
for(let i=0;i<117;i++){const c=document.createElement("span");if([22,23,31,32,40,41,49,50,58,59,67,68,76,77].includes(i))c.classList.add("hot");heroGrid.appendChild(c);}

// Short knowledge check
const questions=[
 {q:"What does your finger change when it touches a capacitive screen?",a:["The local capacitance / electric field","The screen's temperature","The phone's battery voltage"],correct:0,why:"Correct. Your finger affects the local electric field, changing the capacitance measured by the sensor system."},
 {q:"What is the touchscreen controller's job?",a:["Make the glass brighter","Analyse sensor readings and estimate touch position","Store photographs"],correct:1,why:"Correct. The controller processes sensor readings to estimate where the touch happened."},
 {q:"Why can a touchscreen support multi-touch?",a:["It can identify more than one touch location","It uses a louder speaker","It has a larger battery"],correct:0,why:"Correct. The sensor system and controller can detect and process multiple touch locations."}
];
let qIndex=0,score=0,answered=false;
function showQuestion(){
 const q=questions[qIndex];answered=false;
 $("quizStep").textContent=`QUESTION ${qIndex+1} / ${questions.length}`;
 $("quizScore").textContent=`SCORE: ${score}`;
 $("quizQuestion").textContent=q.q;$("quizFeedback").textContent="";$("quizNext").disabled=true;
 $("quizNext").textContent=qIndex===questions.length-1?"See my result →":"Next question →";
 $("quizOptions").innerHTML="";
 q.a.forEach((answer,i)=>{
  const b=document.createElement("button");b.className="quiz-option";b.textContent=answer;
  b.addEventListener("click",()=>{
   if(answered)return;answered=true;
   [...$("quizOptions").children].forEach((el,j)=>{el.disabled=true;if(j===q.correct)el.classList.add("correct");});
   if(i===q.correct){score++;b.classList.add("correct");$("quizFeedback").textContent=q.why;}
   else{b.classList.add("wrong");$("quizFeedback").textContent="Not quite. "+q.why;}
   $("quizScore").textContent=`SCORE: ${score}`;$("quizNext").disabled=false;
  });$("quizOptions").appendChild(b);
 });
}
$("quizNext").addEventListener("click",()=>{
 if(!answered)return;
 if(qIndex<questions.length-1){qIndex++;showQuestion();}
 else{$("quizQuestion").textContent=`You scored ${score} out of ${questions.length}!`;$("quizOptions").innerHTML="";$("quizFeedback").textContent="Explore the simulator again and try to improve your understanding.";$("quizNext").textContent="Try again";$("quizNext").disabled=false;qIndex=-1;score=0;}
 if(qIndex===-1){$("quizNext").onclick=null;}
});
showQuestion();
