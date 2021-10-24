<script>
  import { fade } from 'svelte/transition';
  export let addPressed;

  function addPress() {
    addPressed = !addPressed;
  }
</script>

<button on:click={addPress} transition:fade={{ duration: 200 }}>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
</button>

<style>
  button {
    overflow: hidden;
    position: absolute;
    right: 0;
    bottom: 0;
    margin: 30px;
    padding: 7.5px;
    border: none;
    border-radius: 100%;
    background: #63b9db;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  button svg {
    width: 50px;
    height: 50px;
    stroke: #efefef;
    stroke-width: 1.25;
  }
  button:hover {
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  button:active {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
</style>