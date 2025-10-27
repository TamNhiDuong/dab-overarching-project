<script>
  let text = $state("");
  let submitted = $state(false);
  let charCount = $state(0);
  let ifCount = $state(0);

  function handleSubmit() {
    console.log("CLICK!!!!!!!");
    submitted = true;
    charCount = text.length;
    // Count "if" occurrences (case sensitive)
    ifCount = (text.match(/\bif\b/g) || []).length;
  }
</script>

<textarea bind:value={text}></textarea>
<br />
<button on:click={handleSubmit}>Submit</button>

{#if submitted}
  <p>Characters: {charCount}</p>
  <p>ifs: {ifCount}</p>
{/if}
