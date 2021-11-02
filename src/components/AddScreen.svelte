<script>
  import { fly, fade } from 'svelte/transition';
  export let addPressed;

  function addPress() {
    addPressed = !addPressed;
  }
</script>

<div class="container" on:click={addPress} transition:fade="{{ duration: 200 }}">
  <div class="forms" transition:fly={{ delay: 200, y: 150, duration: 250 }}>
  </div>
</div>


<style>
  div.container {
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    position: absolute;
    background-color: rgba(0, 0, 0, 0.25);
    z-index: 20;
    display: flex;
    justify-content: center;
    overflow: hidden;
  }
  div.forms {
    border-radius: 10px 10px 0 0;
    position: absolute;
    height: 500px;
    width: 875px;
    background-color: #EFEFEF;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    bottom: 0;
  }
</style>