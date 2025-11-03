<script>
  import { onMount } from "svelte";
  let languages = $state([]);

  onMount(async () => {
    const res = await fetch("/api/languages");
    languages = await res.json();
    console.log("languages: ", languages);
  });
</script>

<h1>Available languages</h1>
<ul>
  {#each languages as lang}
    <li><a href={`/languages/${lang.id}`}>{lang.name}</a></li>
  {/each}
</ul>
