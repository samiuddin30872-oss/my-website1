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
})();

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
