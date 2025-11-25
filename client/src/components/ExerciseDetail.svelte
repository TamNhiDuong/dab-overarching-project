<script>
  import { onMount } from "svelte";
  import { useUserState } from "../states/userState.svelte.js";
  const user = useUserState();

  const props = $props();
  let exId = props.exId;

  // Exercise state
  let exercise = $state({ id: null, title: "", description: "" });

  // Editor / submission state
  let text = $state("");
  let submitted = $state(false);
  let submissionId = $state(null);
  let gradingStatus = $state("");
  let grade = $state(null);

  // Prediction state
  let prediction = $state(null);
  let timer = null;

  async function handleSubmit() {
    if (!text) return;

    // Send submission to server
    const res = await fetch(`/api/exercises/${exId}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_code: text }),
    });

    if (!res.ok) {
      console.error("Failed to submit exercise");
      return;
    }

    const data = await res.json();
    submissionId = data.id;
    submitted = true;

    // Start polling grading status every 500ms
    const poll = setInterval(async () => {
      const statusRes = await fetch(`/api/submissions/${submissionId}/status`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        gradingStatus = statusData.grading_status;
        grade = statusData.grade;

        if (gradingStatus === "graded") {
          clearInterval(poll);
        }
      } else {
        console.error("Failed to fetch grading status");
        clearInterval(poll);
      }
    }, 500);
  }

  // Prediction logic (called when user stops typing)
  function handleInput() {
    if (timer) clearTimeout(timer);

    timer = setTimeout(async () => {
      if (!text.trim()) return;

      try {
        const res = await fetch("/inference-api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exercise: exId, code: text }),
        });

        if (res.ok) {
          const data = await res.json();
          prediction = Math.round(data.prediction);
        } else {
          prediction = null;
          console.error("Prediction request failed");
        }
      } catch (err) {
        prediction = null;
        console.error("Error fetching prediction:", err);
      }
    }, 500); // 500ms debounce
  }

  onMount(async () => {
    const res = await fetch(`/api/exercises/${exId}`);
    if (res.ok) {
      exercise = await res.json();
    } else {
      exercise = { id: null, title: "Exercise not found", description: "" };
    }
  });
</script>

{#if exercise.id !== null}
  <h1>{exercise.title}</h1>
  <p>{exercise.description}</p>

  {#if user.loading}
    <p>Loading...</p>
  {:else if !user.email}
    <p>Login or register to complete exercises.</p>
  {:else}
    <!-- Editor -->
    <textarea bind:value={text} on:input={handleInput}></textarea>

    <!-- Prediction -->
    {#if prediction !== null}
      <p>Correctness estimate: {prediction}%</p>
    {/if}

    <br />
    <button
      on:click={handleSubmit}
      disabled={submitted && gradingStatus !== "graded"}
    >
      Submit
    </button>

    {#if submitted}
      <p>Grading status: {gradingStatus}</p>
      {#if gradingStatus === "graded"}
        <p>Grade: {grade}</p>
      {/if}
    {/if}
  {/if}
{:else}
  <h1>Exercise not found</h1>
{/if}
