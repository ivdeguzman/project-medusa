<script>
  import { fly } from 'svelte/transition';
  import { searchValue, searchIndex } from "../stores/search";
  $: if ($searchValue) {
    $searchIndex = 0
  }
</script>

<!-- svelte-ignore a11y-autofocus -->
<input in:fly={{ delay: 200, y: -50, duration: 200 }} out:fly={{ y: -50, duration: 200 }} class="text-center font-light h-8 max-w-xl w-full my-4 sticky top-4 rounded-full custom-bg-white z-20" bind:value={$searchValue} type=text placeholder="Type to search..." />

<style>
  input {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
</style>