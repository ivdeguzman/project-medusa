<script>
  import { fly, fade } from "svelte/transition";
  import { addToggle, addToggleComplete, subWindowStatus } from "../stores/ui";
  import { pageIndex } from "../stores/pages";
  import { newProfile, editProfile, selectedProfile } from "../stores/profile";
  import { onDestroy } from "svelte";
  import SubWindowForm1 from "./SubWindowForm1.svelte";
  import SubWindowForm2 from "./SubWindowForm2.svelte";
  import SubWindowForm3 from "./SubWindowForm3.svelte";
  import SubWindowForm4 from "./SubWindowForm4.svelte";
  import SubWindowFormStatusReq from "./SubWindowFormStatusReq.svelte";
  import SubWindowFormStatusRes from "./SubWindowFormStatusRes.svelte";
  import SubWindowFormEdit from "./SubWindowFormEdit.svelte";
  let subWindowButtonDisabled = false;

  if ($subWindowStatus != 10)
    if ($pageIndex == 1) {
      $newProfile = {
        Name: {
          First: "",
          Last: "",
        },
        Occupation: "",
        LoggedIn: false,
        Images: {
          First: "",
          Second: "",
        },
      }
    } else {
      $newProfile = {
        Name: {
          First: "",
          Last: "",
        },
        Student: {
          Course: "",
          Year: "",
          Section: "",
        },
        LoggedIn: false,
        Images: {
          First: "",
          Second: "",
        },
      }
    }

  let switchState = () => {
    $addToggle = !$addToggle;
  }  
  let switchPageAdd = () => {
    if ($subWindowStatus == 5 || $subWindowStatus == 6) {
      if ($editProfile != "") {
        $selectedProfile = $editProfile;
      }
      $addToggleComplete = !$addToggleComplete;
      switchState();
    }
    else {
      subWindowStatus.set($subWindowStatus + 1)
      subWindowButtonDisabled = true;
    }
  }
  let switchPageRemove = () => {
    subWindowStatus.set($subWindowStatus - 1)
    subWindowButtonDisabled = false;
  }
  let saveButton = () => {
    subWindowStatus.set(4);
    subWindowButtonDisabled = true;
  }

  onDestroy(() => {
    $subWindowStatus = 0;
    $newProfile = "";
    subWindowButtonDisabled = undefined;
  });
</script>

<div class="background fixed w-screen h-screen bg-black opacity-20" in:fade="{{ duration: 200 }}" out:fade="{{delay: 250, duration: 200 }}" />
<div class="sub-window fixed pl-14 w-screen h-screen bg-transparent flex justify-center items-center">
  <div class="sub-window-main grid w-full h-full sm:rounded-xl px-5 py-5" in:fly={{ delay: 250, y: 500, duration: 200 }} out:fly="{{y: 50,  duration: 200 }}">
    <!-- Top Buttons -->
    <div class="w-full bg-transparent">
      <button disabled={$subWindowStatus >= 4 && $subWindowStatus != 10} on:click={switchState} class="close-btn font-light rounded-full w-20 h-6">Close</button>
    </div>
    <!-- View Port -->
    <div class="bg-transparent overflow-hidden">
      {#if $subWindowStatus == 0}
        <SubWindowForm1 />
      {:else if $subWindowStatus == 1}
        <SubWindowForm2 bind:subWindowButtonDisabled />
      {:else if $subWindowStatus == 2}
        <SubWindowForm3 bind:subWindowButtonDisabled />
      {:else if $subWindowStatus == 3}
        <SubWindowForm4 bind:subWindowButtonDisabled />
      {:else if $subWindowStatus == 4}
        <SubWindowFormStatusReq bind:subWindowButtonDisabled />
      {:else if $subWindowStatus == 5 || $subWindowStatus == 6}
        <SubWindowFormStatusRes />
      {:else if $subWindowStatus == 10}
        <SubWindowFormEdit />
      {/if}
    </div>
    <!-- Buttom Buttons -->
    {#if $subWindowStatus < 10}
      <div class="flex w-full justify-between items-center bg-transparent">
        <button class="font-light rounded-full w-20 h-6" disabled={$subWindowStatus <= 0 || $subWindowStatus >= 4} on:click={switchPageRemove}>Back</button>
        <div class="bg-transparent flex flex-row">
          <div class="nav-indicator w-7 h-2 mx-1 rounded-full" class:active={$subWindowStatus >= 0}></div>
          <div class="nav-indicator w-7 h-2 mx-1 rounded-full" class:active={$subWindowStatus >= 1}></div>
          <div class="nav-indicator w-7 h-2 mx-1 rounded-full" class:active={$subWindowStatus >= 2}></div>
          <div class="nav-indicator w-7 h-2 mx-1 rounded-full" class:active={$subWindowStatus >= 3}></div>
          <div class="nav-indicator w-7 h-2 mx-1 rounded-full" class:active={$subWindowStatus >= 4}></div>
          <div class="nav-indicator w-7 h-2 mx-1 rounded-full" class:active={$subWindowStatus >= 5}></div>
        </div>
        <button class="font-light rounded-full w-20 h-6" disabled={subWindowButtonDisabled} on:click={switchPageAdd}>Next</button>
      </div>
    {:else}
      <div class="flex w-full justify-center items-center bg-transparent">
        <button class="font-light rounded-full w-20 h-6" on:click={saveButton}>Save</button>
      </div>
    {/if}
  </div>
</div>

<style>
  div.nav-indicator {
    background: transparent;
    transition: 150ms ease-in-out;
    box-shadow: inset 0px 4px 4px rgba(150, 150, 150, 0.05);
  }
  div.active {
    background: #63b9db;
    box-shadow: 0px 4px 4px rgba(150, 150, 150, 0.05);
  }
  button {
    transition: 150ms ease-in-out;
    transition: box-shadow 150ms ease-in-out;
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
  button.close-btn:hover,
  button.close-btn:active {
    color: #e6c2bf;
  }
  button:disabled,
  button.close-btn:disabled {
    box-shadow: inset 0px 4px 4px rgba(150, 150, 150, 0.05);
    color: lightgray;
  }
  div.background {
    z-index: 45;
  }
  div.sub-window {
    z-index: 46;
  }
  div.sub-window-main {
    background-color: #242424;
    grid-template-rows: auto 1fr auto;
  }
  @media screen and (min-width: 640px) {
    .sub-window-main {
      width: 28rem;
      height: 32rem; 
    }
  }
</style>