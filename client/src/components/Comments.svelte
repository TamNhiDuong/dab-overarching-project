<script>
  import { commentState } from "../states/commentState.svelte.js";

  let newComment = $state("");

  function submitComment() {
    commentState.add(newComment);
    newComment = "";
  }

  function add(e) {
    if (e.key === "Enter" && newComment.trim() !== "") {
      submitComment();
    }
  }
</script>

<div>
  <input
    type="text"
    placeholder="Add a comment"
    bind:value={newComment}
    on:keypress={add}
  />
  <button on:click={submitComment}>Add</button>
</div>

<ul>
  {#each commentState.comments as comment}
    <li>{comment}</li>
  {/each}
</ul>
