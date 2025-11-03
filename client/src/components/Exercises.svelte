<script>
  import { onMount } from "svelte";

  const props = $props();
  let langId = props.langId;

  let exercises = $state([]);

  onMount(async () => {
    const res = await fetch(`/api/languages/${langId}/exercises`);
    exercises = await res.json();
  });
</script>

<h1>Available exercises</h1>
<ul>
  {#each exercises as ex}
    <li><a href={`/exercises/${ex.id}`}>{ex.title}</a></li>
  {/each}
</ul>
