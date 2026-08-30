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

    try {
      const complaintNumber = generateComplaintNumber();

      const name = document.querySelector("#name")?.value.trim();
      const phone = document.querySelector("#phone")?.value.trim();
      const service = document.querySelector("#service")?.value;
      const problem = document.querySelector("#problem")?.value.trim();
      const address = document.querySelector("#address")?.value.trim();
      const photoInput = document.querySelector("#photo");
      const photo = photoInput?.files?.[0];

      if (!name || !phone || !service || !problem || !address) {
        result.textContent = "कृपया सभी जानकारी भरें।";
        return;
      }

      let photoUrl = "";

      // Photo upload
      if (photo) {
        const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath =
          `${complaintNumber}/${Date.now()}-${safeName}`;

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
      } else {
        result.textContent = "कृपया complaint की photo चुनें।";
        return;
      }

      // Database row
      const row = {
        customer_name: name,
        phone: phone,
        service: service,
        problem: problem,
        photo_url: photoUrl,
        address: address,
        status: "Pending"
      };

      const { data, error } = await supabase
        .from("complaints")
        .insert([row])
        .select()
        .single();

      if (error) {
        result.textContent =
          "Complaint error: " + error.message;
        return;
      }

      result.innerHTML = `
        <strong>Complaint Successfully Registered!</strong><br><br>
        Complaint Number: <b>${complaintNumber}</b><br>
        Status: <b>Pending</b><br><br>
        कृपया Complaint Number सुरक्षित रखें।
      `;

      form.reset();

    } catch (error) {
      result.textContent =
        "Complaint error: " + error.message;
      console.error(error);
    }
  });
}
