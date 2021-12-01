<script>
  import { fade, fly } from "svelte/transition";
  import { pageIndex, pageTitle } from "../stores/pages";
  import { selectedProfile, editProfile } from "../stores/profile";
  import { searchIndex, searchValue } from "../stores/search";
  import { sidebar, addToggle } from "../stores/ui";
  let pageSwitch = (num) => {
    $pageIndex = num;
    switch (num) {
      case 0:
        $pageTitle = "Students";
        $sidebar = false;
        break;
      case 1:
        $pageTitle = "Employees";
        $sidebar = false;
        break;
      }
    $selectedProfile = ""; 
    $editProfile = "";
    $searchIndex = 0;
    $searchValue = "";
  }
  let sidebarActiveToggle = () => {
    $sidebar = !$sidebar;
  }
  let switchState = () => {
    $addToggle = !$addToggle;
    sidebarActiveToggle();
  }
</script>

<div class="md:hidden">
  <div transition:fade={{duration: 150 }} on:click={sidebarActiveToggle} class="fixed z-40 w-screen h-screen bg-black opacity-20" />
  <div transition:fly={{x: -250, duration: 150 }} class:show={$sidebar} class="fixed z-50 w-96 h-screen ml-14 flex flex-col justify-between" style="background: #242424">
    <div class="flex flex-col bg-transparent">
      <h1 class="px-5 font-light flex justify-center items-center text-4xl h-16 text-center bg-transparent"><span class="bg-transparent custom-text-blue">P</span>:Medusa</h1>
      <button on:click={() => pageSwitch(0)} class="text-2xl text-left font-light pl-5 mb-3 mx-5 h-10 rounded-xl mt-5">Students</button>
      <button on:click={() => pageSwitch(1)} class="text-2xl text-left font-light pl-5 mb-3 mx-5 h-10 rounded-xl">Employees</button>
    </div>
    <button on:click={switchState} class="text-2xl text-left font-light pl-5 mb-3 mx-5 h-10 rounded-xl mb-5">Add</button>
  </div>
</div>

<style>
  button, h1 {
    color: #efefef;
  }
  button:hover {
    box-shadow: 0px 4px 4px rgba(150, 150, 150, 0.05);
    color: #63b9db;
  }
  button:active {
    box-shadow: inset 0px 4px 4px rgba(150, 150, 150, 0.05);
    color: #63b9db;
  }
</style>