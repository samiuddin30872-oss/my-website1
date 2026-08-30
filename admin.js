import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import{SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY}from"./supabase.js";
const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const login=document.querySelector("#login"),out=document.querySelector("#loginResult"),dash=document.querySelector("#dashboard"),list=document.querySelector("#list");
login.addEventListener("submit",async e=>{e.preventDefault();const{error}=await supabase.auth.signInWithPassword({email:email.value,password:password.value});
if(error){out.textContent=error.message;return}login.style.display="none";dash.style.display="block";load()});
async function load(){const{data,error}=await supabase.from("complaints").select("*").order("created_at",{ascending:false});
if(error){list.textContent=error.message;return}list.innerHTML=data.map(x=>`<article style="margin:15px 0"><b>${x.complaint_number||x.id}</b><br>${x.customer_name}<br>${x.phone}<br>${x.service}<br>${x.problem}<p>Status: <select data-id="${x.id}"><option>Pending</option><option>Assigned</option><option>In Progress</option><option>Completed</option></select></p>${x.photo_url?`<a href="${x.photo_url}" target="_blank">📷 Photo</a>`:""}</article>`).join("");
list.querySelectorAll("select").forEach(s=>{const row=data.find(x=>x.id===s.dataset.id);s.value=row.status;s.onchange=async()=>{const{error}=await supabase.from("complaints").update({status:s.value}).eq("id",s.dataset.id);if(error)alert(error.message)}})}
document.querySelector("#refresh").onclick=load;
