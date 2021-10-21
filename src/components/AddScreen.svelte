<script>
  import { fade } from 'svelte/transition';
  export let addPressed;

  function addPress() {
    addPressed = !addPressed;
  }
</script>

<div on:click={addPress} transition:fade="{{ duration: 200 }}">

</div>


<style>
  div {
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    position: absolute;
    background-color: rgba(0, 0, 0, 0.25);
    z-index: 20;
  }
</style>