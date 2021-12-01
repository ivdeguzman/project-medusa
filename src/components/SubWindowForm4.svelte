<script>
  const { ipcRenderer } = require("electron");
  import { fly } from "svelte/transition";
  import { newProfile } from "../stores/profile";
  export let subWindowButtonDisabled;

  let selectImage = (num) => {
    switch (num) {
      case 1:
        $newProfile.Images.First = ipcRenderer.sendSync("select-image");
        break;
      case 2:
        $newProfile.Images.Second = ipcRenderer.sendSync("select-image");
        break; 
    }
  }

  $: if ($newProfile.Images.First != "" && $newProfile.Images.Second != "") {
    subWindowButtonDisabled = false;
  } else {
    subWindowButtonDisabled = true;
  }
</script>

<div class="bg-transparent flex flex-col justify-center items-center h-full w-full" in:fly={{delay: 200, y: -100, duration: 150 }} out:fly={{y: 100, duration: 150}}>
  <p class="bg-transparent font-light text-3xl mt-2 custom-text-blue text-center">Click one of the circles, add an image.</p>
  <div class="bg-transparent flex flex-row justify-center items-center">
    {#if $newProfile.Images.First == ""}
      <svg class="my-2 mx-2 w-32 h-32 stroke-1 rounded-full custom-bg-blue" style="stroke: #efefef" on:click={() => selectImage(1)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    {:else}
      <img class="my-2 mx-2 w-32 h-32 stroke-1 rounded-full custom-bg-blue object-cover" on:click={() => selectImage(1)} src="{$newProfile.Images.First}" alt="First">
    {/if}
    {#if $newProfile.Images.Second == ""}
      <svg class="my-2 mx-2 w-32 h-32 stroke-1 rounded-full custom-bg-blue" style="stroke: #efefef" on:click={() => selectImage(2)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    {:else}
      <img class="my-2 mx-2 w-32 h-32 stroke-1 rounded-full custom-bg-blue object-cover" on:click={() => selectImage(2)} src="{$newProfile.Images.Second}" alt="Second">
    {/if}
  </div>
</div>

<style>
  svg, img {
    box-shadow: 0px 4px 4px rgba(150, 150, 150, 0.05);
  }
  svg:hover,
  svg:active,
  img:hover,
  img:active {
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
</style>