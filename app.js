import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase.js";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const form = document.querySelector("#complaintForm");
const result = document.querySelector("#result");

function generateComplaintNumber() {
  return "RR-" + Math.floor(100000 + Math.random() * 900000);
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    result.textContent = "Complaint submit हो रही है...";

    const complaintNumber = generateComplaintNumber();

    const name = document.querySelector("#name")?.value.trim();
    const phone = document.querySelector("#phone")?.value.trim();
    const service = document.querySelector("#service")?.value;
    const problem = document.querySelector("#problem")?.value.trim();
    const address = document.querySelector("#address")?.value.trim();
    const photoInput = document.querySelector("#photo");
    const photo = photoInput?.files?.[0];

    if (!name || !phone || !service || !problem || !address) {
      result.textContent = "कृपया सभी जरूरी जानकारी भरें।";
      return;
    }

    let photoUrl = null;

    // Upload photo
    if (photo) {
      const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${complaintNumber}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("complaint-photos")
        .upload(filePath, photo);

      if (uploadError) {
        result.textContent =
          "Photo upload error: " + uploadError.message;
        return;
      }

      const { data: publicData } = supabase.storage
        .from("complaint-photos")
        .getPublicUrl(filePath);

      photoUrl = publicData.publicUrl;
    }

    // Save complaint
    const row = {
      complaint_number: complaintNumber,
      customer_name: name,
      phone: phone,
      service: service,
      problem: problem,
      photo_url: photoUrl,
      address: address
    };

    const { error: insertError } = await supabase
      .from("complaints")
      .insert([row]);

    if (insertError) {
      result.textContent =
        "Complaint error: " + insertError.message;
      return;
    }

    result.innerHTML =
      `Complaint Number: <b>${complaintNumber}</b><br>
       आपकी complaint successfully दर्ज हो गई।<br>
       इसे सुरक्षित रखें।`;

    form.reset();
  });
}
