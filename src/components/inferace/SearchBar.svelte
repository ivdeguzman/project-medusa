<script>
  export let searchValue;
</script>

<div>
  <input placeholder="Search..." bind:value={searchValue} />
  <button>
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
  </button>
</div>

<style>
  div {
    width: auto;
    height: auto;
    display: flex;
    justify-content: center;
    margin: 17.5px;
  }
  input, button {
    border: none;
    height: 32px;
    background: none;
  }
  input {
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
  }
</style>