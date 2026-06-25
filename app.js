document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("ack-form");
  const submitBtn = document.getElementById("ack-submit");
  const statusEl = document.getElementById("ack-status");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("ack-name").value.trim();
    const agree = document.getElementById("ack-agree").checked;

    statusEl.textContent = "";
    statusEl.className = "";

    if (!name || !agree) {
      statusEl.textContent = "Please enter your name and check the agreement box.";
      statusEl.className = "status-error";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, agree }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Submission failed.");
      }

      statusEl.textContent = "Thank you — your acknowledgment has been recorded.";
      statusEl.className = "status-success";
      form.reset();
    } catch (err) {
      statusEl.textContent = err.message || "Something went wrong. Please try again.";
      statusEl.className = "status-error";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });
});
