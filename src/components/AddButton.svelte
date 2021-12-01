<script>
  import { addToggle } from "../stores/ui";

  let switchState = () => {
    $addToggle = !$addToggle;
  }
</script>

<button on:click={switchState} class="md:grid hidden fixed right-6 bottom-5 custom-bg-blue w-16 h-16 z-30 rounded-full place-items-center">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none" 
    stroke="#efefef" 
    stroke-width="1.25" 
    stroke-linecap="round" 
    stroke-linejoin="round" 
    class="w-14 h-14 bg-transparent"
  >
    <line
      x1="12" 
      y1="5" 
      x2="12" 
      y2="19"
    ></line>
    <line
      x1="5"
      y1="12" 
      x2="19" 
      y2="12"
    ></line>
  </svg>
</button>

<style>
  button {
    transition: 150ms ease-in-out;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  button:hover {
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  button:active {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
</style>