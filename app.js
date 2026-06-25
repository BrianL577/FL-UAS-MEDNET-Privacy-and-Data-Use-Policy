document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("ack-date");
  if (dateInput) dateInput.max = new Date().toISOString().slice(0, 10);

  const form = document.getElementById("ack-form");
  const submitBtn = document.getElementById("ack-submit");
  const statusEl = document.getElementById("ack-status");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("ack-name").value.trim();
    const date = document.getElementById("ack-date").value;
    const agree = document.getElementById("ack-agree").checked;

    statusEl.textContent = "";
    statusEl.className = "";

    if (!name || !date || !agree) {
      statusEl.textContent = "Please fill in your name, date, and check the agreement box.";
      statusEl.className = "status-error";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date, agree }),
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
