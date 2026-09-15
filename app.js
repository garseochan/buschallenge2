(function(){
"use strict";

var LIMIT_MS=30000;
var POINT_BENEFIT_ID="planet-bus-route-point";
var ROUTES={
  "9007":{
    bus:"9007",type:"직행좌석",origin:"운중동먹거리촌",destination:"서울역",direction:"서울역행",split:[3,5],
    questions:[
      q("운중초",["서현역","모란시장"]),
      q("운중행정복지센터",["광교호수공원","신촌동"]),
      q("판교박물관",["수원시청","남위례역"]),
      q("엔씨·안랩",["경기대","복정고"]),
      q("판교역",["잠실새내","태평오거리"]),
      q("고속터미널",["아주대","삼평교"]),
      q("명동",["운중도서관","수서역"]),
      q("서울시청",["월드컵경기장","야탑역"])
    ]
  },
  "1007-1":{
    bus:"1007-1",type:"직행좌석",origin:"대광빌리지",destination:"잠실역(롯데월드)",direction:"잠실역행",split:[5,3],
    questions:[
      q("아주대",["모란역","삼평교"]),
      q("수원월드컵경기장",["명동","위례자이"]),
      q("광교역",["서울시청","판교박물관"]),
      q("운중행정복지센터",["수서역","농수산물시장"]),
      q("판교박물관",["대광빌리지","야탑역"]),
      q("판교제2테크노밸리",["고속터미널","아주대"]),
      q("수서역",["광교역사공원","모란고개"]),
      q("삼전역",["운중초","수원시청"])
    ]
  },
  "4500":{
    bus:"4500",type:"직행좌석",origin:"수원버스터미널",destination:"사송동종점",direction:"사송동행",split:[6,2],
    questions:[
      q("수원시청역",["서울역","삼평교"]),
      q("아주대",["남위례역","운중초"]),
      q("수원월드컵경기장",["명동","모란시장"]),
      q("경기대",["수서역","판교역"]),
      q("광교역사공원",["복정고","서울시청"]),
      q("운중행정복지센터",["잠실새내","농수산물시장"]),
      q("야탑역",["광교역","고속터미널"]),
      q("모란역",["판교박물관","위례자이"])
    ]
  },
  "315":{
    bus:"315",type:"일반버스",origin:"금토동삼거리",destination:"복정역 환승센터",direction:"복정역행",split:[2,6],
    questions:[
      q("판교제2테크노밸리",["수원시청","운중초"]),
      q("삼평교",["명동","광교역"]),
      q("야탑역",["아주대","수서역"]),
      q("모란역",["판교박물관","서울시청"]),
      q("남위례역",["경기대","고속터미널"]),
      q("래미안위례",["농수산물시장","삼전역"]),
      q("위례자이",["광교호수공원","운중도서관"]),
      q("복정고",["수원월드컵경기장","판교역"])
    ]
  }
};

function q(name,distractors){return {name:name,distractors:distractors};}
function $(id){return document.getElementById(id);}
function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
function ok(r){return !!(r&&r.ok===true);}
function data(r){return r&&r.data?r.data:{};}
function shuffle(items){var a=items.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}

var state={routeKey:"9007",bridge:null,index:0,wrong:0,startAt:0,timer:null,busy:false,issueSeq:"",ended:false,runId:0};
function route(){return ROUTES[state.routeKey];}

function showScreen(name){document.querySelectorAll(".screen").forEach(function(el){el.classList.toggle("active",el.id==="screen-"+name);});document.body.dataset.screen=name;window.scrollTo(0,0);}
function toast(message){$("toast").textContent=message;$("toast").classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(function(){$("toast").classList.remove("show");},1500);}

function routeNodes(r){var nodes=[{name:r.origin,kind:"terminal"}];for(var i=0;i<r.split[0];i++)nodes.push({name:r.questions[i].name,kind:"quiz"});nodes.push({name:"SK플래닛",kind:"planet"});for(var j=r.split[0];j<r.questions.length;j++)nodes.push({name:r.questions[j].name,kind:"quiz"});nodes.push({name:r.destination,kind:"terminal"});return nodes;}

function renderRouteTabs(){var order=["9007","1007-1","4500","315"];
  $("route-tabs").innerHTML=order.map(function(key){return '<button type="button" class="route-tab '+(key===state.routeKey?'active':'')+'" data-route="'+key+'"><b>'+key+'</b><span>'+esc(ROUTES[key].destination)+'</span></button>';}).join("");
}
function renderCourse(){var r=route();renderRouteTabs();$("route-number").textContent=r.bus;$("route-type").textContent=r.type;$("route-origin").textContent=r.origin;$("route-destination").textContent=r.destination;
  var nodes=routeNodes(r), quizNo=0;
  $("route-stops").innerHTML=nodes.map(function(stop,i){
    var badge=stop.kind==='quiz'?String(++quizNo):(stop.kind==='planet'?'경유':(i===0?'출':'도'));
    return '<li class="'+stop.kind+'" style="--n:'+i+'"><i>'+badge+'</i><span>'+esc(stop.name)+'</span>'+(stop.kind==='quiz'?'<small>QUIZ</small>':'')+'</li>';
  }).join("");
  var planetIndex=r.split[0]+1, pts=[];
  nodes.forEach(function(stop,i){
    var y,x;
    if(i===0){y=395;x=150;}
    else if(i===planetIndex){y=215;x=165;}
    else if(i===nodes.length-1){y=35;x=170;}
    else if(i<planetIndex){var t=i/planetIndex;y=395-(180*t);x=150+Math.sin(i*1.25)*62;}
    else {var denom=(nodes.length-1-planetIndex);var t2=(i-planetIndex)/denom;y=215-(180*t2);x=165+Math.sin(i*1.25)*62;}
    pts.push([x,y]);
  });
  var d=pts.map(function(pt,i){return (i?'L':'M')+pt[0].toFixed(1)+' '+pt[1].toFixed(1);}).join(' ');
  $("route-map-line").innerHTML='<path class="map-route-shadow" d="'+d+'"></path><path class="map-route-path" d="'+d+'"></path>';
  Array.from($("route-stops").children).forEach(function(li,i){li.style.left=(pts[i][0]/320*100)+'%';li.style.top=(pts[i][1]/430*100)+'%';});
}

function waitForBridge(){return new Promise(function(resolve){if(window.OGOGBridge){resolve(window.OGOGBridge);return;}var done=false;function ready(){if(done)return;done=true;window.removeEventListener("ogogbridge:ready",ready);resolve(window.OGOGBridge||null);}window.addEventListener("ogogbridge:ready",ready);setTimeout(ready,4500);});}
async function report(type,score,body){if(!state.bridge||!state.bridge.execution||!state.bridge.execution.report)return null;try{return await state.bridge.execution.report({type:type,score:score,resultCode:body&&body.resultCode,resultType:body&&body.resultType,body:body});}catch(e){return null;}}
async function reportStart(){var r=route();return report("START",0,{entryPath:"start",gameId:"planet-bus-route-challenge",routeNumber:r.bus,direction:r.origin+" > SK플래닛 > "+r.destination,totalQuestions:8,timeLimitMs:LIMIT_MS});}
async function reportFinish(success,elapsedMs){var r=route();return report("COMPLETE",success?1:0,{entryPath:"result",resultType:success?"SUCCESS":"FAIL",resultCode:success?"CLEAR_30SEC":"TIMEOUT",routeNumber:r.bus,elapsedMs:elapsedMs,correctCount:state.index,wrongCount:state.wrong,totalQuestions:8,timeLimitMs:LIMIT_MS,destination:r.destination});}
async function refreshParticipation(){if(!state.bridge||!state.bridge.participation){$("main-chance").textContent="출발 준비가 끝났어요";$("start-button").disabled=false;return;}try{var res=await state.bridge.participation.getState();var d=data(res);$("main-chance").textContent=typeof d.remainingCount==="number"?"오늘 "+d.remainingCount+"번 운전할 수 있어요":"출발 준비가 끝났어요";$("start-button").disabled=d.playable===false;}catch(e){$("main-chance").textContent="출발 준비가 끝났어요";$("start-button").disabled=false;}}

function setDriving(on){$("driver-view").classList.toggle("driving",on);$("driver-view").classList.toggle("stopped",!on);}
function setStatus(text){$("drive-status").textContent=text;}
function renderGameHeader(){var r=route();$("game-bus-number").textContent=r.bus;$("game-title").textContent=r.direction;}
function updateTimer(){if(state.ended)return;var elapsed=performance.now()-state.startAt;var left=Math.max(0,LIMIT_MS-elapsed);$("stopwatch").textContent=(left/1000).toFixed(1);if(left<=3000)$("stopwatch").classList.add("danger");if(left<=0)timeoutGame();}

async function startGame(){if(state.busy)return;state.busy=true;state.ended=false;state.runId++;var run=state.runId;state.index=0;state.wrong=0;state.issueSeq="";clearInterval(state.timer);$("stopwatch").classList.remove("danger");$("stopwatch").textContent="30.0";$("choice-panel").classList.add("is-hidden");$("flag-name").textContent="?";$("checkpoint").className="checkpoint";renderGameHeader();showScreen("game");await reportStart();
  setDriving(true);setStatus(route().origin+" 출발!");await wait(650);if(run!==state.runId)return;state.startAt=performance.now();state.timer=setInterval(updateTimer,50);state.busy=false;approachQuestion(run);
}

async function approachQuestion(run){if(state.ended||run!==state.runId)return;state.busy=true;setDriving(true);setStatus("다음 정류장으로 이동 중");$("choice-panel").classList.add("is-hidden");$("checkpoint").className="checkpoint";$("flag-name").textContent="?";
  await wait(260);if(state.ended||run!==state.runId)return;
  renderChoices();$("choice-panel").classList.remove("is-hidden");setStatus("달리면서 정류장 이름을 맞혀주세요");
  $("checkpoint").classList.add("rolling");state.busy=false;
  var thisIndex=state.index;
  await wait(1650);if(state.ended||run!==state.runId||state.index!==thisIndex)return;
  if(!$("checkpoint").classList.contains("named")&&!$("checkpoint").classList.contains("passed")){
    $("checkpoint").classList.remove("rolling");$("checkpoint").classList.add("hold-at-windshield");
    setDriving(false);setStatus("정답을 골라주세요");
  }
}

function renderChoices(){var qn=route().questions[state.index];var choices=shuffle([qn.name].concat(qn.distractors));$("game-progress").textContent=(state.index+1)+" / 8";$("choice-remaining").textContent="3개 선택 가능";$("choices").innerHTML=choices.map(function(name){return '<button type="button" class="choice-button" data-name="'+esc(name)+'"><span>'+esc(name)+'</span></button>';}).join("");}

async function chooseStop(button){if(state.busy||state.ended||button.disabled)return;var run=state.runId;var qn=route().questions[state.index];if(button.dataset.name!==qn.name){state.wrong++;button.disabled=true;button.classList.add("wrong");var left=$("choices").querySelectorAll("button:not(:disabled)").length;$("choice-remaining").textContent=left+"개 남았어요";setStatus("다시 선택해주세요");$("warning").classList.add("show");setTimeout(function(){$("warning").classList.remove("show");},650);return;}
  state.busy=true;button.classList.add("correct");$("flag-name").textContent=qn.name;$("checkpoint").classList.remove("rolling","hold-at-windshield");$("checkpoint").classList.add("named");setStatus(qn.name+" 정답!");await wait(180);if(state.ended||run!==state.runId)return;
  $("choice-panel").classList.add("is-hidden");setDriving(true);setStatus("통과!");await wait(60);$("checkpoint").classList.add("passed");state.index++;
  await wait(470);if(state.ended||run!==state.runId)return;
  if(state.index===route().split[0])await passPlanet(run);
  if(state.ended||run!==state.runId)return;
  if(state.index>=8){finishSuccess();return;}
  state.busy=false;approachQuestion(run);
}

async function wrongEffect(run){state.busy=true;setDriving(false);$("driver-view").classList.add("braking");$("warning").classList.add("show");setStatus("오답! 버스 정지");await wait(420);if(state.ended||run!==state.runId)return;$("warning").classList.remove("show");$("driver-view").classList.remove("braking");state.busy=false;}

async function passPlanet(run){
  if(state.ended||run!==state.runId)return;
  $("choice-panel").classList.add("is-hidden");
  $("checkpoint").className="checkpoint planet-gate";
  $("flag-name").textContent="SK플래닛";
  setDriving(true);setStatus("SK플래닛 경유");
  await wait(180);if(state.ended||run!==state.runId)return;
  $("checkpoint").classList.add("approach","named");
  await wait(1360);if(state.ended||run!==state.runId)return;
  $("checkpoint").classList.add("passed");toast("SK플래닛 통과!");
  await wait(500);if(state.ended||run!==state.runId)return;
  $("checkpoint").className="checkpoint";$("flag-name").textContent="?";
}

async function finishSuccess(){if(state.ended)return;state.ended=true;clearInterval(state.timer);state.busy=true;var elapsed=Math.min(LIMIT_MS,Math.round(performance.now()-state.startAt));setDriving(false);setStatus(route().destination+" 도착!");await wait(350);var response=await reportFinish(true,elapsed);var benefit=(data(response).benefits||[]).find(function(item){return item.benefitId===POINT_BENEFIT_ID;});state.issueSeq=benefit&&benefit.benefitIssueSeq!=null?String(benefit.benefitIssueSeq):"";renderResult(true,elapsed);state.busy=false;}

async function timeoutGame(){if(state.ended)return;state.ended=true;state.runId++;clearInterval(state.timer);state.busy=true;$("stopwatch").textContent="0.0";$("choice-panel").classList.add("is-hidden");setDriving(false);setStatus("운행 시간 종료!");await reportFinish(false,LIMIT_MS);await showAd();renderResult(false,LIMIT_MS);state.busy=false;}

async function showAd(){var overlay=$("ad-overlay");overlay.classList.remove("is-hidden");for(var n=2;n>=1;n--){$("ad-count").textContent=n;await wait(700);}$("ad-count").textContent="×";await wait(350);overlay.classList.add("is-hidden");}

function renderResult(success,elapsed){var r=route();showScreen("result");$("result-label").textContent=success?"MISSION COMPLETE":"TIME OVER";$("result-label").classList.toggle("fail",!success);$("result-icon").textContent=success?"🚌":"⏱️";$("result-title").textContent=success?r.destination+" 도착!":"30초 종료!";$("result-message").innerHTML=success?"8개 정류장을 모두 맞혔어요.<br><b>친구에게 공유하고 1P를 받아보세요!</b>":"종점까지 도착하지 못했어요.<br>광고를 보고 한 번 더 도전할 수 있어요.";$("result-time").innerHTML=(elapsed/1000).toFixed(1)+"<small>초</small>";$("result-detail").textContent="통과 "+state.index+"/8 · 오답 "+state.wrong+"회";$("claim-point-button").classList.toggle("is-hidden",!success);$("claim-point-button").disabled=false;$("claim-point-button").textContent=success?"공유하고 1P 적립":"공유하고 1P 적립";if(success)rainClovers();else $("clover-rain").innerHTML="";}
function rainClovers(){var box=$("clover-rain");box.innerHTML="";for(var i=0;i<18;i++){var img=document.createElement("img");img.src="./images/clover-fall.png";img.alt="";img.style.left=(Math.random()*94)+"%";img.style.animationDelay=(Math.random()*.8)+"s";img.style.animationDuration=(2+Math.random()*1.5)+"s";img.style.width=(20+Math.random()*24)+"px";box.appendChild(img);}}

async function shareAndClaim(){if(state.busy)return;state.busy=true;var btn=$("claim-point-button");btn.disabled=true;var shareText="플래닛 버스 노선 챌린지에서 "+route().bus+"번 노선을 완주했어요!";try{if(navigator.share){await navigator.share({title:"플래닛 버스 노선 챌린지",text:shareText});}else{toast("공유 완료로 처리했어요!");}}catch(e){if(e&&e.name==="AbortError"){btn.disabled=false;state.busy=false;return;}}
  try{if(state.issueSeq&&state.bridge&&state.bridge.reward){var response=await state.bridge.reward.claim({benefitIssueSeq:state.issueSeq});if(!ok(response))throw new Error("CLAIM_FAILED");state.issueSeq="";}btn.textContent="공유 완료 · 1P 적립";toast("1P가 적립됐어요!");}catch(e){toast("공유는 완료됐지만 1P 적립을 확인하지 못했어요.");btn.disabled=false;}state.busy=false;}

async function adReplay(){if(state.busy)return;state.busy=true;await showAd();state.busy=false;startGame();}

function bind(){
  $("route-tabs").addEventListener("click",function(e){var b=e.target.closest(".route-tab");if(!b)return;state.routeKey=b.dataset.route;renderCourse();});
  $("start-button").onclick=startGame;
  $("choices").addEventListener("click",function(e){var b=e.target.closest(".choice-button");if(b)chooseStop(b);});
  $("quit-button").onclick=function(){state.ended=true;state.runId++;clearInterval(state.timer);state.busy=false;showScreen("course");$("start-button").disabled=false;};
  $("ad-replay-button").onclick=adReplay;
  $("course-button").onclick=function(){showScreen("course");$("start-button").disabled=false;};
  $("claim-point-button").onclick=shareAndClaim;
}

async function boot(){renderCourse();bind();state.bridge=await waitForBridge();await refreshParticipation();}
boot();
})();
