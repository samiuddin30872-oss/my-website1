import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import{SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY}from"./supabase.js";
const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const form=document.querySelector("#complaintForm"),result=document.querySelector("#result");
const complaintNo=()=>"RR-"+Math.floor(100000+Math.random()*900000);
form.addEventListener("submit",async e=>{e.preventDefault();result.textContent="Submitting...";
const no=complaintNo(),photo=document.querySelector("#photo").files[0];let photo_url=null;
if(photo){const safe=photo.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=`${no}/${Date.now()}-${safe}`;
const up=await supabase.storage.from("complaint-photos").upload(path,photo);
if(up.error){result.textContent="Photo upload error: "+up.error.message;return}
photo_url=supabase.storage.from("complaint-photos").getPublicUrl(path).data.publicUrl}
const row={complaint_number:no,customer_name:document.querySelector("#name").value,phone:document.querySelector("#phone").value,
service:document.querySelector("#service").value,problem:document.querySelector("#problem").value,photo_url,address:document.querySelector("#address").value,status:"Pending"};
const{error}=await supabase.from("complaints").insert(row);
if(error){result.textContent="Complaint error: "+error.message;return}
result.innerHTML=`✅ Complaint Number: <b>${no}</b><br>इसे सुरक्षित रखें।`;form.reset()});
document.querySelector("#statusForm").addEventListener("submit",async e=>{e.preventDefault();
const no=document.querySelector("#statusNo").value.trim().toUpperCase();
const{data,error}=await supabase.from("complaints").select("complaint_number,status,service,created_at").eq("complaint_number",no).maybeSingle();
document.querySelector("#statusResult").innerHTML=error?`❌ ${error.message}`:data?`✅ ${data.complaint_number}<br>Status: <b>${data.status}</b><br>Service: ${data.service}`:"❌ Complaint नहीं मिली।"});
