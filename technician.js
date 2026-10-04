import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import{SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY}from"./supabase.js";
const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);

const params=new URLSearchParams(window.location.search);
const code=params.get("code");

const loadingMsg=document.querySelector("#loadingMsg");
const techPanel=document.querySelector("#techPanel");
const errorMsg=document.querySelector("#errorMsg");
const startBtn=document.querySelector("#startBtn");
const stopBtn=document.querySelector("#stopBtn");
const shareStatus=document.querySelector("#shareStatus");

let technician=null;
let watchId=null;

(async function init(){
  if(!code){showError();return}
  const{data,error}=await supabase.from("technicians").select("*").eq("access_code",code).maybeSingle();
  if(error||!data){showError();return}
  technician=data;
  document.querySelector("#techNameShow").textContent=technician.name;
  loadingMsg.style.display="none";
  techPanel.style.display="block";
  loadMyComplaints();
})();

const myComplaintsEl=document.querySelector("#myComplaints");
async function loadMyComplaints(){
  if(!technician)return;
  myComplaintsEl.innerHTML="Load ho raha hai...";
  const{data,error}=await supabase.from("complaints").select("*").eq("technician_id",technician.id).order("created_at",{ascending:false});
  if(error){myComplaintsEl.textContent=error.message;return}
  if(!data||data.length===0){myComplaintsEl.innerHTML="<p>Abhi koi complaint assign nahi hui.</p>";return}
  myComplaintsEl.innerHTML=data.map(x=>`<article style="margin:14px 0;border-top:1px solid #ddd;padding-top:10px">
    <b>${x.complaint_number}</b><br>${x.customer_name} — ${x.phone}<br>${x.service}<br>${x.problem}
    ${x.address?`<br>📍 ${x.address}`:""}
    <p>Status: <select data-id="${x.id}"><option>Pending</option><option>Assigned</option><option>In Progress</option><option>Completed</option></select></p>
  </article>`).join("");
  myComplaintsEl.querySelectorAll("select").forEach(s=>{
    const row=data.find(x=>x.id===s.dataset.id);
    s.value=row.status;
    s.onchange=async()=>{await supabase.from("complaints").update({status:s.value}).eq("id",s.dataset.id)};
  });
}
document.querySelector("#refreshComplaints").onclick=loadMyComplaints;

function showError(){
  loadingMsg.style.display="none";
  errorMsg.style.display="block";
}

startBtn.onclick=()=>{
  if(!("geolocation"in navigator)){shareStatus.textContent="❌ Is browser mein location support nahi hai.";return}
  shareStatus.textContent="Permission maang rahe hain...";
  watchId=navigator.geolocation.watchPosition(
    async(pos)=>{
      shareStatus.textContent="🟢 Live — location share ho rahi hai ("+new Date().toLocaleTimeString("hi-IN")+")";
      await supabase.from("technicians").update({
        latitude:pos.coords.latitude,
        longitude:pos.coords.longitude,
        location_updated_at:new Date().toISOString()
      }).eq("id",technician.id);
    },
    (err)=>{shareStatus.textContent="❌ Error: "+err.message;},
    {enableHighAccuracy:true,maximumAge:15000,timeout:20000}
  );
  startBtn.style.display="none";
  stopBtn.style.display="inline-flex";
};

stopBtn.onclick=()=>{
  if(watchId!==null)navigator.geolocation.clearWatch(watchId);
  shareStatus.textContent="⏹ Location sharing band ho gayi.";
  startBtn.style.display="inline-flex";
  stopBtn.style.display="none";
};
