<script>
  import { fly } from "svelte/transition";
  import { newProfile } from "../stores/profile";
  import { pageIndex } from "../stores/pages";
  export let subWindowButtonDisabled;
  let message;

  if ($pageIndex == 0) {
    message = "Who is this wonderful student?";
  } else message ="Who is this lucky employee?";

  $: if ($newProfile.Name.First != "" && $newProfile.Name.Last != "") {
    subWindowButtonDisabled = false;
  } else subWindowButtonDisabled = true;
</script>

<div class="bg-transparent flex flex-col justify-center items-center h-full w-full" in:fly={{delay: 200, y: -100, duration: 150 }} out:fly={{y: 100, duration: 150}}>
  <p class="bg-transparent font-light text-3xl mt-2 custom-text-blue text-center">{message}</p>
  <div class="bg-transparent flex flex-col">
    <input class="font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center mt-4" style="color: #efefef" type="text" bind:value={$newProfile.Name.First} placeholder="Enter first name">
    <input class="font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center" style="color: #efefef" type="text" bind:value={$newProfile.Name.Last} placeholder="Enter last name">
  </div>
</div>

<style>
  input {
    box-shadow: 0px 4px 4px rgba(150, 150, 150, 0.05);
  }
</style>