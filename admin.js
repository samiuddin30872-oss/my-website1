import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import{SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY}from"./supabase.js";
import{enableComplaintNotifications}from"./push-notifications.js";
const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const ADMIN_USERNAME="raja";
const ADMIN_PASSWORD="246810";
const login=document.querySelector("#login"),out=document.querySelector("#loginResult"),dash=document.querySelector("#dashboard"),list=document.querySelector("#list");

// Agar pehle se login hai (session saved hai), to seedha dashboard dikhayen
if(sessionStorage.getItem("rajaAdminLoggedIn")==="true"){
  login.style.display="none";dash.style.display="block";load();
}

login.addEventListener("submit",e=>{
  e.preventDefault();
  if(email.value.trim()===ADMIN_USERNAME && password.value===ADMIN_PASSWORD){
    sessionStorage.setItem("rajaAdminLoggedIn","true");
    out.textContent="";
    login.style.display="none";dash.style.display="block";load();
  } else {
    out.textContent="Galat username ya password. Dobara try karein.";
  }
});

async function load(){const{data,error}=await supabase.from("complaints").select("*").order("created_at",{ascending:false});
if(error){list.textContent=error.message;return}list.innerHTML=data.map(x=>`<article style="margin:15px 0"><b>${x.complaint_number||x.id}</b><br>${x.customer_name}<br>${x.phone}<br>${x.service}<br>${x.problem}<p>Status: <select data-id="${x.id}"><option>Pending</option><option>Assigned</option><option>In Progress</option><option>Completed</option></select></p>${x.photo_url?`<a href="${x.photo_url}" target="_blank">📷 Photo</a>`:""}</article>`).join("");
list.querySelectorAll("select").forEach(s=>{const row=data.find(x=>x.id===s.dataset.id);s.value=row.status;s.onchange=async()=>{const{error}=await supabase.from("complaints").update({status:s.value}).eq("id",s.dataset.id);if(error)alert(error.message)}})}
document.querySelector("#refresh").onclick=load;

const notifBtn=document.querySelector("#enableNotif"),notifStatus=document.querySelector("#notifStatus");
if("Notification"in window && Notification.permission==="granted"){
  notifStatus.textContent="✅ Notifications already ON hain.";
}
notifBtn.onclick=async()=>{
  notifStatus.textContent="Setup ho raha hai...";
  const result=await enableComplaintNotifications();
  notifStatus.textContent=(result===true)?"✅ Notifications ON ho gaye!":("❌ "+result);
};
