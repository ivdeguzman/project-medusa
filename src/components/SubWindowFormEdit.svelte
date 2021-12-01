<script>
  import { fly } from "svelte/transition";
  import { pageIndex } from "../stores/pages"
  import { selectedProfile, editProfile } from "../stores/profile";
  editProfile.set($selectedProfile);
</script>

<div class="bg-transparent flex flex-col justify-center items-center h-full w-full" in:fly={{delay: 200, y: -100, duration: 150 }} out:fly={{y: 100, duration: 150}}>
  <p class="bg-transparent font-light text-3xl mt-2 custom-text-blue text-center">What's wrong with {$selectedProfile.Name.First}?</p>
  <div class="bg-transparent flex flex-col">
    <input class="font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center mt-4" style="color: #efefef" type="text" bind:value={$editProfile.Name.First} placeholder="Enter first name">
    <input class="font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center" style="color: #efefef" type="text" bind:value={$editProfile.Name.Last} placeholder="Enter last name">
    {#if $pageIndex == 0}
      <input class="font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center" style="color: #efefef" type="text" bind:value={$editProfile.Student.Course} placeholder="Enter course">
      <div class="bg-transparent flex w-80 justify-between items-center flex-row">
        <input class="font-light w-full mr-2 rounded-full px-5 py-1 mb-2 bg-transparent text-center" style="color: #efefef" type="text" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');" bind:value={$editProfile.Student.Year} placeholder="Enter year">
        <input class="font-light w-full ml-2 rounded-full px-5 py-1 mb-2 bg-transparent text-center" style="color: #efefef" type="text" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');" bind:value={$editProfile.Student.Section} placeholder="Enter section">
      </div>
    {:else if $pageIndex == 1}
      <input class="font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center" style="color: #efefef" type="text" bind:value={$editProfile.Occupation} placeholder="Enter occupation">
    {/if}
  </div>
</div>

<style>
  input {
    box-shadow: 0px 4px 4px rgba(150, 150, 150, 0.05);
  }
</style>