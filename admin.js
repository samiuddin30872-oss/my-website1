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

// ---- Catalogue / Rate List management ----
const catForm=document.querySelector("#catForm"),catResult=document.querySelector("#catResult"),catListEl=document.querySelector("#catList");

async function loadCatalogue(){
  const{data,error}=await supabase.from("catalogue").select("*").order("display_order",{ascending:true}).order("created_at",{ascending:true});
  if(error){catListEl.textContent=error.message;return}
  catListEl.innerHTML=data.map(x=>`<article style="margin:12px 0;border-top:1px solid #ddd;padding-top:10px">
    ${x.image_url?`<img src="${x.image_url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;display:block;margin-bottom:6px">`:""}
    <b>${x.name}</b> (${x.category})<br>${x.price}
    <br><button type="button" class="btn" style="background:#c0392b;padding:6px 14px;font-size:13px;margin-top:6px" data-del="${x.id}" data-img="${x.image_url||''}">Delete</button>
  </article>`).join("")||"<p>Abhi koi item nahi hai.</p>";
  catListEl.querySelectorAll("[data-del]").forEach(btn=>{
    btn.onclick=async()=>{
      if(!confirm("Delete karein?"))return;
      await supabase.from("catalogue").delete().eq("id",btn.dataset.del);
      const img=btn.dataset.img;
      if(img){const path=img.split("/catalogue-images/")[1];if(path)await supabase.storage.from("catalogue-images").remove([path]);}
      loadCatalogue();
    };
  });
}
loadCatalogue();

catForm.addEventListener("submit",async e=>{
  e.preventDefault();
  catResult.textContent="Save ho raha hai...";
  const category=document.querySelector("#catCategory").value;
  const name=document.querySelector("#catName").value.trim();
  const price=document.querySelector("#catPrice").value.trim();
  const photoInput=document.querySelector("#catPhoto");
  let image_url=null;
  try{
    if(photoInput.files[0]){
      const file=photoInput.files[0];
      const path=`${Date.now()}-${file.name}`;
      const{error:upErr}=await supabase.storage.from("catalogue-images").upload(path,file);
      if(upErr)throw upErr;
      image_url=supabase.storage.from("catalogue-images").getPublicUrl(path).data.publicUrl;
    }
    const{error}=await supabase.from("catalogue").insert({category,name,price,image_url});
    if(error)throw error;
    catResult.textContent="✅ Add ho gaya!";
    catForm.reset();
    loadCatalogue();
  }catch(err){
    catResult.textContent="❌ "+(err.message||err);
  }
});
