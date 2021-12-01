<script>
  import { selectedProfile, selectedProfileData, selectedProfileCurrentIndex } from "../stores/profile";
  import { addToggle, subWindowStatus } from "../stores/ui";
  import { pageIndex } from "../stores/pages";
  import { onDestroy } from "svelte";
  import { fly, fade } from "svelte/transition";
  import { studentCurrentIndex } from "../stores/student";
  import { employeeCurrentIndex } from "../stores/employee";
  import AttendanceCard from "../components/AttendanceCard.svelte";
  const axios = require("axios").default;
  let notYetDeleted = true, deleteAsk = false, historyAsk = false;

  let editProfile = async () => {
    $subWindowStatus = 10;
    $addToggle = true;
    deleteAsk = false
    historyAsk = false;
  }
  let deleteProfileAsk = () => {
    deleteAsk = true;
    historyAsk = false;
  }
  let deleteProfileCancel = () => {
    deleteAsk = false;
  }
  let deleteProfileProceed = async () => {
    let url;
    if ($pageIndex == 0) {
      url = `http://localhost:14500/api/student/delete/${$selectedProfile._id}`
    } else {
      url = `http://localhost:14500/api/employee/delete/${$selectedProfile._id}`
    }
    let data = await axios.delete(url);
    if (data.data.status == 1) {
      $studentCurrentIndex = 1;
      $employeeCurrentIndex = 1;
      $selectedProfile = "";
    }
  }
  let deleteHistoryAsk = () => {
    historyAsk = true;
    deleteAsk = false;
  }
  let deleteHistoryCancel = () => {
    historyAsk = false;
  }
  let deleteHistory = async () => {
    let url;
    if ($pageIndex == 0) {
      url = `http://localhost:14500/api/student/delete/${$selectedProfile._id}/history`
    } else {
      url = `http://localhost:14500/api/employee/delete/${$selectedProfile._id}/history`
    }
    let data = await axios.delete(url);
    if (data.data.status == 1) {
      $selectedProfileCurrentIndex = 1;
      notYetDeleted = false;
      historyAsk = false;
    }
  }

  onDestroy(() => {
    notYetDeleted = undefined;
  });
</script>

{#if $selectedProfile}
  <div class="flex justify-center items-center flex-col my-5" in:fly={{ delay: 500, y: -50, duration: 200 }} out:fade={{ duration: 200 }}>
    <h1 class="bg-transparent text-center font-light mx-5 text-5xl">{$selectedProfile.Name.Last}, {$selectedProfile.Name.First}</h1>
    <h2 class="bg-transparent text-center font-light mx-5 text-xl mt-2">{$selectedProfile.Occupation || $selectedProfile.Student.Course + " " + $selectedProfile.Student.Year + "-" + $selectedProfile.Student.Section}</h2>
    <div class="bg-transparent flex w-full justify-center sm:flex-row flex-col mt-3 items-center">
      <button class="sm:w-40 w-4/6 rounded-full mx-2 py-0.5 font-light my-1 sm:my-0" style="background: #efefef" on:click={editProfile}>Edit Profile</button>
      <div class="bg-transparent mx-2 sm:w-40 w-4/6 flex flex-row py-0.5 my-1 sm:my-0" style="transition: 150ms ease-in-out">
        {#if deleteAsk}
          <button class="w-full rounded-full mr-2 font-light" style="background: #efefef" on:click={deleteProfileCancel}>No</button>
          <button class="danger w-full rounded-full font-light" style="background: #efefef" on:click={deleteProfileProceed}>Yes</button>
        {:else}
          <button class="danger w-full rounded-full font-light" style="background: #efefef" on:click={deleteProfileAsk}>Delete Profile</button>
        {/if}
      </div>
      <div class="bg-transparent mx-2 sm:w-40 w-4/6 flex flex-row py-0.5 my-1 sm:my-0" style="transition: 150ms ease-in-out">
        {#if historyAsk}
          <button class="w-full rounded-full mr-2 font-light" style="background: #efefef" on:click={deleteHistoryCancel}>No</button>
          <button class="danger w-full rounded-full font-light" style="background: #efefef" on:click={deleteHistory}>Yes</button>
        {:else}
          <button class="danger w-full rounded-full font-light" style="background: #efefef" on:click={deleteHistoryAsk}>Delete History</button>
        {/if}
      </div>
    </div>

    {#await $selectedProfileData then profileData}
      {#if profileData.length != 0 && notYetDeleted}
        <table class="mt-5 mb-14 w-11/12 md:max-w-4xl text-center" in:fly={{ delay: 500, y: -50, duration: 200 }} out:fade={{ duration: 200 }}>
          <tr>
            <th class="font-medium py-2 px-4 border border-black" style="color: #efefef; background: #242424;" in:fly={{ delay: 500, y: -50, duration: 200 }} out:fade={{ duration: 200 }}>Status</th>
            <th class="font-medium py-2 px-4 border border-black" style="color: #efefef; background: #242424;" in:fly={{ delay: 500, y: -50, duration: 200 }} out:fade={{ duration: 200 }}>Via</th>
            <th class="font-medium py-2 px-4 border border-black" style="color: #efefef; background: #242424;" in:fly={{ delay: 500, y: -50, duration: 200 }} out:fade={{ duration: 200 }}>Date DD-MM-YYYY</th>
            <th class="font-medium py-2 px-4 border border-black" style="color: #efefef; background: #242424;" in:fly={{ delay: 500, y: -50, duration: 200 }} out:fade={{ duration: 200 }}>Time HH:MM:SS</th>
          </tr>
          {#each profileData as attendance (attendance._id)}
            <AttendanceCard {attendance} />
          {/each}
        </table>
      {:else}
        <h1 class="bg-transparent mt-9 text-2xl font-light mx-5 text-center" in:fly={{ delay: 500, y: -50, duration: 200 }} out:fade={{ duration: 200 }}>{$selectedProfile.Name.First} currently has no record, please check again later.</h1>
      {/if}
    {/await}
  </div>
{/if}

<style>
  button {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    transition: 150ms ease-in-out;
  }
  button:hover,
  button:active {
    color: #63b9db;
  }
  button.danger:hover,
  button.danger:active {
    color: #e6c2bf;
  }
  button:active {
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  table {
    border-spacing: 5px;
  }
</style>