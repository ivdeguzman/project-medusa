<script>
  import { onDestroy } from "svelte";
  import { fly, fade } from 'svelte/transition';
  import AttendanceContainer from "./AttendanceContainer.svelte";
  import EditScreen from "../EditScreen.svelte";
  const io = require("socket.io-client");
  const socket = io("http://127.0.0.1:14500");
  export let tabIndex, selectedProfile;
  let editButtonClicked = false;

  onDestroy(() => {
    socket.disconnect();
    editButtonClicked = undefined;
  })

  let deleteProfile = () => {
    switch (tabIndex) {
      case 0:
        socket.emit("studentDataDeleteRequest", selectedProfile);
        break;
      case 1:
        socket.emit("employeeDataDeleteRequest", selectedProfile);
        break;
    }
  }

  let clearHistory = () => {
    socket.emit("userHistoryDeleteRequest", selectedProfile);
  }

  let editButtonToggle = () => {
    editButtonClicked = !editButtonClicked;
  }

  socket.on("userDataDeleteStatus", () => {
    selectedProfile = null;
  })
</script>

{#if selectedProfile != null}
  <div class="container">
    <div class="details-section" in:fly={{ delay: 350, y: -50, duration: 250 }} out:fade={{ duration: 200 }}>
      <h1>{selectedProfile.Name.First} {selectedProfile.Name.Last}</h1>
      {#if tabIndex == 0}
        <p class="subtitle">{selectedProfile.Student.Course} {selectedProfile.Student.Year}-{selectedProfile.Student.Section}</p>
      {:else}
        <p class="subtitle">{selectedProfile.Occupation}</p>
      {/if}
      <section>
        <button on:click={editButtonToggle}>Edit Profile</button>
        <button class="danger" on:click={deleteProfile}>Delete Profile</button>
        <button class="danger" on:click={clearHistory}>Clear History</button>
      </section>
    </div>

    <div class="attendance-section">
      <AttendanceContainer {selectedProfile} />
    </div>
  </div>
  {#if editButtonClicked == true}
    <EditScreen bind:editButtonClicked {selectedProfile} {tabIndex} />
  {/if}
{/if}

<style>
  div.container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-rows: auto 1fr;
    justify-content: center;
  }
  div.details-section {
    width: 100%;
    height: 100%;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
  }
  h1 {
    margin: 5px;
    margin-top: 20px;
    font-size: 32px;
    font-weight: 350;
    text-align: center;
  }
  p.subtitle {
    font-size: 24px;
    color: rgba(0, 0, 0, 0.5);
    text-align: center;
  }
  button {
    font-family: inherit;
    transition: 100ms ease-in-out;
  }
  button:hover {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    color: #63b9db;
  }
  button:active {
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
    color: #63b9db;
  }
  button.danger:hover {
    color: #E6C2BF;
  }
  button.danger:active {
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
    color: #E6C2BF;
  }
  section {
    width: 100%;
    height: 35px;
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }
  section button {
    height: 100%;
    width: 150px;
    margin: 0 15px;
    border-radius: 50px;
    border: none;
    font-size: 17.5px;
    font-weight: 350;
  }
</style>