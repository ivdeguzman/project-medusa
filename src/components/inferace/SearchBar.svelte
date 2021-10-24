<script>
  import { fly } from 'svelte/transition';
  export let searchValue;
  
  function clearValue() {
    searchValue = "";
  }
</script>

<div transition:fly={{ y: -50, duration: 250 }}>
  <input placeholder="Search..." bind:value={searchValue} />
  <button on:click={clearValue}>
    {#if searchValue == ""}
      <svg
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        class="feather feather-search">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg" 
        width="24"
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        class="delete"
      >
        <line
          x1="18" 
          y1="6" 
          x2="6" 
          y2="18">
        </line>
        <line 
          x1="6" 
          y1="6" 
          x2="18" 
          y2="18">
        </line>
      </svg>
    {/if}
  </button>
</div>

<style>
  div {
    width: 100%;
    height: auto;
    display: flex;
    justify-content: center;
    position: sticky;
    z-index: 5;
    top: 20px;
  }
  input, button {
    border: none;
    height: 32px;
    background: #efefef;
  }
  input {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    width: 500px;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    border-radius: 50px;
    font-size: 15px;
    padding: 0 60px 0 20px;
  }
  button {
    margin-left: -60px;
    border-radius: 0 50px 50px 0;
    padding: 0 20px;
  }
  svg {
    margin-left: -5px;
    stroke: rgba(0, 0, 0, 0.5);
    transition: ease-in-out 100ms;
  }
  svg.delete:hover {
    stroke: #63b9db;
    transition: ease-in-out 100ms;
  }
</style>