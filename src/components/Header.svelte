<script>
  import { pageIndex, pageTitle } from "../stores/pages";
  import { selectedProfile, editProfile } from "../stores/profile";
  import { searchIndex, searchValue } from "../stores/search";
  import { sidebar } from "../stores/ui";
  let pageSwitch = (num) => {
    $pageIndex = num;
    switch (num) {
      case 0:
        $pageTitle = "Students";
        break;
      case 1:
        $pageTitle = "Employees";
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
</script>

<div class="header custom-bg-white w-full h-16 grid md:px-0 px-6">
  <div class="md:hidden flex justify-start items-center">
    <button on:click={sidebarActiveToggle} class="px-2 py-2 rounded-full">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="currentColor" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
      </svg>
    </button>
  </div>
  <div class="flex items-center">
    <h1 class="md:block hidden custom-bg-white flex justify-start items-center font-light text-4xl md:ml-5 bg-transparent"><span class="custom-text-blue bg-transparent">P</span>:MEDUSA</h1>
    <h1 class="md:hidden block custom-bg-white flex justify-start items-center font-light text-4xl md:ml-5 bg-transparent">{$pageTitle}</h1>
  </div>
  <div class="custom-bg-white bg-transparent place-self-center md:block hidden">
    <button class:active={$pageIndex == 0} on:click={() => pageSwitch(0)} class="mx-1 rounded-xl w-36 py-1 font-light text-2xl">Students</button>
    <button class:active={$pageIndex == 1} on:click={() => pageSwitch(1)} class="mx-1 rounded-xl w-36 py-1 font-light text-2xl">Employees</button>
  </div>
</div>

<style>
  div {
    transition: 150ms ease-in-out;
  }
  div.header {
    grid-template-columns: 1fr auto 1fr;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.025);
    z-index: 30;
  }
  button {
    transition: 150ms ease-in-out;
  }
  button:hover {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    color: #63b9db;
  }
  button:active {
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
    color: #63b9db;
  }
  button.active {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
</style>