<script>
  import { onMount } from "svelte";

  // Props from parent
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

  onMount(async () => {
    const res = await fetch(`/api/exercises/${exId}`);
    if (res.ok) {
      const data = await res.json();
      exercise = data;
    } else {
      exercise = { id: null, title: "Exercise not found", description: "" };
    }
  });
</script>

{#if exercise.id !== null}
  <h1>{exercise.title}</h1>
  <p>{exercise.description}</p>

  <textarea bind:value={text}></textarea>
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
{:else}
  <h1>Exercise not found</h1>
{/if}
